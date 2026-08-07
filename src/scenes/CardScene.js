// ── CARD SCENE — "THE INVESTIGATION DESK" ──────────────────────────────
// Blue Prince-inspired rework: 3-card hand selection builds the conspiracy
// board in real-time. The board is visible; cards are the player's palette.
//
// Layout (960×600):
//   Top 40px  — Meter bar (CR / HT / DL)
//   310px     — Mini conspiracy board (grows as you investigate)
//   ~190px    — Card tray (3 cards fanned out) + resolve overlay
//   Bottom    — Status bar (round, lost leads, board, publish, menu)

import Phaser from 'phaser';
import { GameState } from '../GameState.js';
import { MiniBoard } from '../components/MiniBoard.js';
import { LeadCard } from '../components/LeadCard.js';
import { MeterBar } from '../components/MeterBar.js';
import { HeatOverlay } from '../components/HeatOverlay.js';
import { DeckManager } from '../engine/DeckManager.js';
import { COLORS, FONTS, SIZES } from '../constants.js';
import { musicManager } from '../audio/MusicManager.js';
import { BALANCE } from '../balanceConfig.js';

const BOARD_TOP = 40;
const BOARD_H = SIZES.DESK_BOARD_H;
const TRAY_TOP = BOARD_TOP + BOARD_H;
const TRAY_H = SIZES.DESK_TRAY_H;
const STATUS_TOP = TRAY_TOP + TRAY_H;
const STATUS_H = SIZES.H - STATUS_TOP;

export class CardScene extends Phaser.Scene {
    constructor() { super({ key: 'CardScene' }); }

    init(data) {
        this.state = data?.gameState || GameState.load() || new GameState();
        if (data?.conspiracyId) this.state.conspiracyId = data.conspiracyId;
    }

    create() {
        musicManager.play('CardScene');
        this.scene.bringToTop('UIOverlayScene');
        this.events.once('shutdown', () => {
            this.tweens.killAll();
            this.input.off('pointerdown');
        });

        this._handCards = [];
        this._resolveUI = null;
        this._publishVisible = false;
        this._leadsLost = 0;

        this._heatOverlay = new HeatOverlay(this);
        this._buildDeck();
        this._buildMeterBar();
        this._buildBoard();
        this._buildTrayBg();
        this._buildStatusBar();

        this._dealNextRound();
    }

    // ── DECK ────────────────────────────────────────────────────────────

    _buildDeck() {
        if (this.state.deck.length > 0) {
            // Re-entering scene with existing deck — just need the DeckManager for beat cards
            const mgr = new DeckManager(this.cache, this.state.conspiracyId);
            mgr.beatCards = this.cache.json.get(
                'conspiracy-' + (this.state.conspiracyId || 'trench_coat_kids').replace(/_/g, '-')
            )?.beatCards || [];
            this._deckMgr = mgr;
            return;
        }
        const mgr = new DeckManager(this.cache, this.state.conspiracyId);
        this.state.deck = mgr.buildDeck();
        this._deckMgr = mgr;
    }

    // ── METERS ──────────────────────────────────────────────────────────

    _buildMeterBar() {
        this.add.rectangle(SIZES.W / 2, SIZES.METER_H / 2, SIZES.W, SIZES.METER_H, COLORS.PANEL);
        const border = this.add.graphics();
        border.lineStyle(1, COLORS.YELLOW, 0.5);
        border.lineBetween(0, SIZES.METER_H, SIZES.W, SIZES.METER_H);

        const colW = SIZES.W / 3;
        this._meters = {
            credibility: new MeterBar(this, 0, 'credibility', 'CR'),
            heat: new MeterBar(this, colW, 'heat', 'HT'),
            deadline: new MeterBar(this, colW * 2, 'deadline', 'DL'),
        };
        this._updateMeters();
    }

    _updateMeters() {
        this._meters.credibility.update(this.state.credibility);
        this._meters.heat.update(this.state.heat);
        this._meters.deadline.update(this.state.deadline);
        this._heatOverlay.update(this.state.heat);
    }

    // ── MINI BOARD ──────────────────────────────────────────────────────

    _buildBoard() {
        this.add.rectangle(SIZES.W / 2, BOARD_TOP + BOARD_H / 2, SIZES.W, BOARD_H, 0x0D0B08);

        const boardKey = 'board-' + (this.state.conspiracyId || 'trench_coat_kids').replace(/_/g, '-');
        const boardData = this.cache.json.get(boardKey);

        this._miniBoard = new MiniBoard(this, 0, BOARD_TOP, SIZES.W, BOARD_H);
        this._miniBoard.init(boardData, this.state);
    }

    // ── TRAY BACKGROUND ────────────────────────────────────────────────

    _buildTrayBg() {
        this.add.rectangle(SIZES.W / 2, TRAY_TOP + TRAY_H / 2, SIZES.W, TRAY_H, 0x1A1208);
        const border = this.add.graphics();
        border.lineStyle(1, COLORS.YELLOW, 0.3);
        border.lineBetween(0, TRAY_TOP, SIZES.W, TRAY_TOP);
    }

    // ── STATUS BAR ──────────────────────────────────────────────────────

    _buildStatusBar() {
        this.add.rectangle(SIZES.W / 2, STATUS_TOP + STATUS_H / 2, SIZES.W, STATUS_H, COLORS.PANEL);
        const border = this.add.graphics();
        border.lineStyle(1, COLORS.YELLOW, 0.5);
        border.lineBetween(0, STATUS_TOP, SIZES.W, STATUS_TOP);

        const cy = STATUS_TOP + STATUS_H / 2;

        // Round counter (left)
        this._roundText = this.add.text(20, cy, '', FONTS.STAMP).setOrigin(0, 0.5);

        // Lost leads counter
        this._lostText = this.add.text(200, cy, '', {
            ...FONTS.STAMP, color: '#CC2222'
        }).setOrigin(0, 0.5);

        // BOARD button
        this._boardBtn = this.add.text(420, cy, '[MAP] BOARD', FONTS.BUTTON)
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        this._boardBtn.on('pointerdown', () => this._fadeToScene('BoardScene', { gameState: this.state }));

        // PUBLISH button (hidden until post-tutorial)
        const pubW = 150;
        const pubH = 30;
        const pubX = SIZES.W - 180;
        this._publishBg = this.add.graphics();
        this._publishBg.fillStyle(0x1D3A1D, 0.9);
        this._publishBg.fillRoundedRect(pubX - pubW / 2, cy - pubH / 2, pubW, pubH, 6);
        this._publishBg.lineStyle(1, COLORS.GREEN, 0.8);
        this._publishBg.strokeRoundedRect(pubX - pubW / 2, cy - pubH / 2, pubW, pubH, 6);
        this._publishBtn = this.add.text(pubX, cy, 'PUBLISH STORY', {
            fontFamily: 'Share Tech Mono', fontSize: '12px', color: '#4A8A6A', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive(
            new Phaser.Geom.Rectangle(-pubW / 2, -pubH / 2, pubW, pubH),
            Phaser.Geom.Rectangle.Contains
        );
        this._publishBtn.on('pointerdown', () => this._voluntaryPublish());
        this._publishBg.setAlpha(0);
        this._publishBtn.setAlpha(0).disableInteractive();

        // Menu button
        this.add.text(SIZES.W - 40, cy, '[=]', FONTS.BUTTON)
            .setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this._fadeToScene('MenuScene'));
    }

    _showPublishButton() {
        if (this._publishVisible) return;
        this._publishVisible = true;
        this._publishBg.setAlpha(1);
        this._publishBtn.setAlpha(1).setInteractive();
        this.tweens.add({
            targets: this._publishBg, alpha: { from: 0.7, to: 1 },
            duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut'
        });
    }

    _voluntaryPublish() {
        this._fadeToScene('PublishScene', { gameState: this.state });
    }

    // ── ROUND / DEAL HELPERS ────────────────────────────────────────────

    _getRound() {
        const idx = this.state.currentIndex;
        if (idx < 4) return idx + 1;
        return 5 + Math.floor((idx - 4) / 3);
    }

    _getTotalRounds() {
        const regularCount = this.state.deck.length - 4;
        return 4 + Math.ceil(regularCount / 3);
    }

    // ── DEAL NEXT ROUND ─────────────────────────────────────────────────

    _dealNextRound() {
        this._handCards.forEach(c => { if (c && c.scene) c.destroy(); });
        this._handCards = [];

        if (this.state.currentIndex >= this.state.deck.length) {
            this._fadeToScene('PublishScene', { gameState: this.state });
            return;
        }

        const idx = this.state.currentIndex;
        const round = this._getRound();
        const isTutorial = idx < 4;

        this._roundText.setText(
            isTutorial ? `Tutorial ${idx + 1}/4` : `Round ${round - 4}`
        );
        this._lostText.setText(this._leadsLost > 0 ? `LOST: ${this._leadsLost}` : '');

        // Post-tutorial transition
        if (idx === 4 && !this._tutorialCompleteSeen) {
            this._tutorialCompleteSeen = true;
            this._showPublishButton();
            const msg = this.add.text(SIZES.W / 2, BOARD_TOP + BOARD_H / 2,
                'Three leads per round. Pick one to investigate.\nThe others are lost forever.\nPublish whenever you\'re ready.', {
                fontFamily: 'Playfair Display', fontSize: '15px', color: '#F5C518',
                fontStyle: 'italic', align: 'center', wordWrap: { width: 500 }
            }).setOrigin(0.5).setAlpha(0);
            this.tweens.add({
                targets: msg, alpha: 1, duration: 400, hold: 2800,
                yoyo: true,
                onComplete: () => { msg.destroy(); this._dealNextRound(); }
            });
            return;
        }

        const card0 = this.state.deck[idx];

        // Tutorial: single card, forced action
        if (card0.tutorial) {
            this._dealTutorialCard(card0);
            return;
        }

        // Regular: deal hand of 3 (or fewer near deck end)
        const hand = [];
        for (let i = 0; i < 3 && (idx + i) < this.state.deck.length; i++) {
            const c = this.state.deck[idx + i];
            if (c.tutorial) break;
            hand.push(c);
        }

        if (hand.length === 1) {
            this._dealTutorialCard(hand[0]);
            return;
        }

        this._dealHand(hand);
    }

    // ── TUTORIAL / SINGLE CARD ──────────────────────────────────────────

    _dealTutorialCard(cardData) {
        const cx = SIZES.W / 2;
        const cy = TRAY_TOP + TRAY_H / 2;

        if (this._tutorialHint) { this._tutorialHint.destroy(); this._tutorialHint = null; }

        if (cardData.tutorial) {
            this._tutorialHint = this.add.text(SIZES.W / 2, BOARD_TOP + BOARD_H - 20,
                cardData.tutorial.hintText, {
                ...FONTS.HINT, wordWrap: { width: 700 }, fontSize: '13px'
            }).setOrigin(0.5).setAlpha(0);
            this.tweens.add({ targets: this._tutorialHint, alpha: 1, duration: 400 });
        }

        const card = new LeadCard(this, cx, cy + 20, cardData, () => {
            const dir = cardData.tutorial?.forcedDirection || 'right';
            this._resolveCard(card, cardData, dir);
        });
        card.setAlpha(0);
        this.tweens.add({ targets: card, alpha: 1, y: cy, duration: 250, ease: 'Sine.Out' });
        this._handCards = [card];
    }

    // ── DEAL HAND OF 3 ─────────────────────────────────────────────────

    _dealHand(handData) {
        const W = SIZES.HAND_CARD_W;
        const GAP = SIZES.HAND_GAP;
        const totalW = handData.length * W + (handData.length - 1) * GAP;
        const startX = (SIZES.W - totalW) / 2 + W / 2;
        const cy = TRAY_TOP + TRAY_H / 2 + 5;

        if (this._pickPrompt) this._pickPrompt.destroy();
        this._pickPrompt = this.add.text(SIZES.W / 2, TRAY_TOP + 8,
            'PICK A LEAD TO PURSUE', {
            fontFamily: 'Share Tech Mono', fontSize: '11px',
            color: '#F5C518', align: 'center'
        }).setOrigin(0.5);

        handData.forEach((cardData, i) => {
            const x = startX + i * (W + GAP);
            const card = new LeadCard(this, x, cy + 30, cardData, (selectedCard) => {
                this._onHandPick(selectedCard, i, handData);
            });
            card.setAlpha(0);
            this.tweens.add({
                targets: card, alpha: 1, y: cy,
                duration: 200, ease: 'Sine.Out', delay: i * 100
            });
            this._handCards.push(card);
        });
    }

    // ── HAND PICK → RESOLVE ─────────────────────────────────────────────

    _onHandPick(selectedCard, selectedIdx, handData) {
        if (this._pickPrompt) { this._pickPrompt.destroy(); this._pickPrompt = null; }

        selectedCard.select();

        // Fly away unchosen cards
        this._handCards.forEach((card, i) => {
            if (card === selectedCard) return;
            const dir = i < selectedIdx ? -1 : 1;
            card.lose(dir);
            this._leadsLost++;
        });
        this._lostText.setText(`LOST: ${this._leadsLost}`);

        // Advance index past unchosen cards
        const skipCount = handData.length - 1;
        this.state.currentIndex += skipCount;

        this.time.delayedCall(350, () => {
            this._showResolveUI(selectedCard, handData[selectedIdx]);
        });
    }

    // ── RESOLVE UI ──────────────────────────────────────────────────────

    _showResolveUI(card, cardData) {
        this._miniBoard.dim(0.5);

        const resolveX = SIZES.W / 2 - 130;
        const resolveY = TRAY_TOP + TRAY_H / 2;
        this.tweens.add({
            targets: card,
            x: resolveX, scaleX: 1.06, scaleY: 1.06,
            duration: 250, ease: 'Sine.Out'
        });

        const btnX = SIZES.W / 2 + 120;
        const buttons = [];

        // INVESTIGATE — always available
        const rightFx = cardData.swipeEffects?.right || {};
        const nodeHint = rightFx.addsNode ? ` → ${rightFx.addsNode.replace(/_/g, ' ')}` : '';
        buttons.push(this._makeResolveBtn(
            btnX, resolveY - 38,
            `INVESTIGATE\n+${rightFx.heatChange || 0} HT${nodeHint}`,
            '#4A8A6A', 0x1D3A1D,
            () => this._resolveCard(card, cardData, 'right')
        ));

        // FABRICATE — always available
        const upFx = cardData.swipeEffects?.up || {};
        const fabNode = upFx.addsNode ? ` → ${upFx.addsNode.replace(/_/g, ' ')} (fake)` : '';
        buttons.push(this._makeResolveBtn(
            btnX, resolveY + 5,
            `FABRICATE\n${upFx.credibilityChange || 0} CR${fabNode}`,
            '#CC2222', 0x2D0808,
            () => this._resolveCard(card, cardData, 'up')
        ));

        // LEAK — conditional on heat ≥ 30 and card having down effects
        if (this.state.heat >= 30 && cardData.swipeEffects?.down) {
            const downFx = cardData.swipeEffects.down;
            buttons.push(this._makeResolveBtn(
                btnX, resolveY + 48,
                `LEAK TO RIVAL\n${downFx.heatChange || 0} HT`,
                '#C8AA40', 0x2D2810,
                () => this._resolveCard(card, cardData, 'down')
            ));
        }

        this._resolveUI = buttons;
    }

    _makeResolveBtn(x, y, label, color, bgColor, callback) {
        const w = 180;
        const h = 36;
        const bg = this.add.graphics();
        bg.fillStyle(bgColor, 0.9);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
        bg.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.7);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);

        const txt = this.add.text(x, y, label, {
            fontFamily: 'Share Tech Mono', fontSize: '10px',
            color, align: 'center', lineSpacing: 1
        }).setOrigin(0.5);

        txt.setInteractive(
            new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
            Phaser.Geom.Rectangle.Contains
        );
        txt.on('pointerdown', callback);
        txt.on('pointerover', () => bg.setAlpha(0.6));
        txt.on('pointerout', () => bg.setAlpha(1));

        return { bg, txt };
    }

    _clearResolveUI() {
        if (this._resolveUI) {
            this._resolveUI.forEach(({ bg, txt }) => { bg.destroy(); txt.destroy(); });
            this._resolveUI = null;
        }
        this._miniBoard.undim();
    }

    // ── RESOLVE CARD ────────────────────────────────────────────────────

    _resolveCard(card, cardData, direction) {
        this._clearResolveUI();
        if (this._tutorialHint) { this._tutorialHint.destroy(); this._tutorialHint = null; }

        let effectiveCard = cardData;
        const prevHeat = this.state.heat;
        const prevCred = this.state.credibility;

        // Tabloid mode
        if (this.state.credibility < BALANCE.tabloidThreshold) {
            const fx = { ...cardData.swipeEffects };
            if (direction === 'up') fx.up = { ...fx.up, credibilityChange: 0 };
            if (direction === 'right') {
                fx.right = { ...fx.right, heatChange: (fx.right?.heatChange || 0) * BALANCE.tabloidHeatMultiplier };
            }
            effectiveCard = { ...cardData, swipeEffects: fx };
        }

        const result = this.state.applySwipe(direction, effectiveCard);

        // Feedback
        const dirLabels = { right: 'INVESTIGATED', up: 'FABRICATED', down: 'LEAKED' };
        const dirColors = { right: '#4A8A6A', up: '#CC2222', down: '#C8AA40' };
        if (this._feedbackText) this._feedbackText.destroy();
        this._feedbackText = this.add.text(SIZES.W / 2, TRAY_TOP + 6,
            (dirLabels[direction] || 'HANDLED') + ': ' + cardData.title, {
            fontFamily: 'Share Tech Mono', fontSize: '11px',
            color: dirColors[direction] || '#F5F0E8', align: 'center'
        }).setOrigin(0.5);

        this._updateMeters();
        this._showMeterDelta('credibility', this.state.credibility - prevCred);
        this._showMeterDelta('heat', this.state.heat - prevHeat);

        // Animate card → board node (or fade out)
        const nodeId = effectiveCard.swipeEffects?.[direction]?.addsNode;
        if (nodeId && this._miniBoard._nodeSprites[nodeId]) {
            const sprite = this._miniBoard._nodeSprites[nodeId];
            this.tweens.add({
                targets: card,
                x: sprite.pos.x, y: sprite.pos.y,
                scaleX: 0.15, scaleY: 0.15, alpha: 0,
                duration: 500, ease: 'Cubic.In',
                onComplete: () => {
                    card.destroy();
                    this._miniBoard.animateNewNode(nodeId);
                }
            });
        } else {
            this.tweens.add({
                targets: card,
                y: card.y - 40, alpha: 0,
                duration: 300, ease: 'Sine.Out',
                onComplete: () => card.destroy()
            });
        }

        // Board button update
        if (this._boardBtn) {
            const n = this.state.boardNodes.length;
            this._boardBtn.setText(n > 0 ? `[MAP] BOARD (${n})` : '[MAP] BOARD');
        }

        this.state.save();

        // Beat card injection
        if (this._deckMgr) {
            const beat = this._deckMgr.findTriggeredBeat(cardData.id, this.state.deck);
            if (beat) this.state.injectBeatCard(beat);
        }

        // Meter-based events
        const didHeatSpike = this.state.heat - prevHeat >= 15;
        const didCredSpike = prevCred - this.state.credibility >= 15;

        let shouldWarnHeat = false;
        if (!this.state.heatWarningSeen && this.state.heat >= BALANCE.heatWarningThreshold && result !== 'ARRESTED') {
            this.state.heatWarningSeen = true;
            shouldWarnHeat = true;
        }

        let shouldPauseForMeter = false;
        let pauseMessage = '';
        if (!this.state.meterTutorialSeen && !cardData.tutorial) {
            if (didHeatSpike) {
                this.state.meterTutorialSeen = true;
                shouldPauseForMeter = true;
                pauseMessage = 'HEAT rises when you investigate dangerous leads.\nIf HEAT fills up, you will be ARRESTED.';
            } else if (didCredSpike) {
                this.state.meterTutorialSeen = true;
                shouldPauseForMeter = true;
                pauseMessage = 'CREDIBILITY drops when you fabricate or leak.\nIf CREDIBILITY empties, you will be FIRED.';
            }
        }

        // Schedule next round
        const finishRound = () => {
            if (this._feedbackText) {
                this.tweens.add({
                    targets: this._feedbackText, alpha: 0,
                    duration: 600, delay: 600,
                    onComplete: () => { if (this._feedbackText) { this._feedbackText.destroy(); this._feedbackText = null; } }
                });
            }

            if (result === 'CONTINUE' || result === 'INJECT_POLICE_KNOCK') {
                if (result === 'INJECT_POLICE_KNOCK') {
                    this._showOverlay(
                        'POLICE AT THE DOOR!',
                        "They're asking questions. Lay low or you'll be arrested!",
                        () => this.time.delayedCall(400, () => this._dealNextRound())
                    );
                } else {
                    this.time.delayedCall(700, () => this._dealNextRound());
                }
            } else if (result === 'PUBLISH_NOW') {
                this.time.delayedCall(500, () => {
                    this._fadeToScene('DeadlineScene', { gameState: this.state });
                });
            } else if (result === 'FIRED' || result === 'ARRESTED') {
                this.time.delayedCall(500, () => {
                    this.cameras.main.fadeOut(200, 200, 0, 0);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        this.scene.start('GameOverScene', { gameState: this.state, cause: result });
                    });
                });
            }
        };

        if (shouldWarnHeat) {
            this._showOverlay('CHIEF EDITOR',
                "Watch it rookie! The cops are sniffing around.\nCool it or you're going to jail!",
                finishRound);
        } else if (shouldPauseForMeter) {
            this._showOverlay('METER WARNING', pauseMessage, finishRound);
        } else {
            finishRound();
        }
    }

    // ── METER DELTA INDICATORS ──────────────────────────────────────────

    _showMeterDelta(key, delta) {
        if (delta === 0) return;
        const meter = this._meters[key];
        if (!meter) return;
        const sign = delta > 0 ? '+' : '';
        const color = (key === 'credibility')
            ? (delta > 0 ? '#4A8A6A' : '#CC2222')
            : (delta > 0 ? '#CC2222' : '#4A8A6A');
        const label = key === 'credibility' ? 'CR' : 'HT';
        const x = meter.x + meter.colW / 2;
        const txt = this.add.text(x, SIZES.METER_H + 6, `${sign}${delta} ${label}`, {
            fontFamily: 'Share Tech Mono', fontSize: '12px', color, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.tweens.add({
            targets: txt, y: SIZES.METER_H + 20, alpha: 0,
            duration: 1200, ease: 'Sine.Out',
            onComplete: () => txt.destroy()
        });
    }

    // ── OVERLAY ─────────────────────────────────────────────────────────

    _showOverlay(title, message, onDismiss) {
        const dim = this.add.rectangle(SIZES.W / 2, SIZES.H / 2, SIZES.W, SIZES.H, 0x000000, 0.85).setDepth(100);
        const t = this.add.text(SIZES.W / 2, SIZES.H / 2 - 50, title, {
            fontFamily: 'Playfair Display', fontSize: '22px', color: '#CC2222', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101);
        const b = this.add.text(SIZES.W / 2, SIZES.H / 2 + 5, message, {
            ...FONTS.STAMP, color: '#F5F0E8', align: 'center', wordWrap: { width: 500 }
        }).setOrigin(0.5).setDepth(101);
        const btn = this.add.text(SIZES.W / 2, SIZES.H / 2 + 60, 'OK \u2192', FONTS.BUTTON)
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(101);

        btn.on('pointerdown', () => {
            dim.destroy(); t.destroy(); b.destroy(); btn.destroy();
            onDismiss();
        });
    }

    // ── SCENE TRANSITION ────────────────────────────────────────────────

    _fadeToScene(key, data = {}) {
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.state.save();
            this.scene.start(key, data);
        });
    }
}
