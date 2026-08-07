import Phaser from 'phaser';
import { NodeObject } from '../components/NodeObject.js';
import { ConnectionLine } from '../components/ConnectionLine.js';
import { evaluateConnection, checkWin } from '../utils/boardValidator.js';
import { drawDashedLine } from '../utils/drawDashedLine.js';
import { COLORS, FONTS, SIZES } from '../constants.js';
import { musicManager } from '../audio/MusicManager.js';

const BOARD_OFFSET_Y = 60; // Leave room for header

export class BoardScene extends Phaser.Scene {
    constructor() { super({ key: 'BoardScene' }); }

    init(data) {
        this.state = data.gameState;
    }

    create() {
        musicManager.play('BoardScene');
        this.scene.bringToTop('UIOverlayScene');

        this.events.once('shutdown', () => {
            this.tweens.killAll();
            this.input.off('pointerdown');
        });

        this.state.boardVisited = true;
        this.state.save();

        this.cameras.main.fadeIn(200, 0, 0, 0);

        // [v4] Setup display layers so connections always render BELOW nodes
        this._bgLayer = this.add.layer(); // Layer 0
        this._connectionsLayer = this.add.layer(); // Layer 1
        this._ghostLayer = this.add.layer(); // Layer 2
        this._nodesLayer = this.add.layer(); // Layer 3

        // Load corresponding board data
        const boardKey = 'board-' + (this.state.conspiracyId || 'trench_coat_kids').replace(/_/g, '-');
        this.boardData = this.cache.json.get(boardKey);

        this._nodes = {};       // id -> NodeObject
        this._connections = [];       // array of ConnectionLine
        this._selected = null;     // currently tapped NodeObject

        this._buildHeader();
        this._bgLayer.add(this.children.list.slice(-4)); // Add header/bg elements to bgLayer
        this._buildBoardBackground();
        this._bgLayer.add(this.children.list.slice(-2)); // Add dot texture and vignette

        this._buildNodes();

        // [v5] Initialise _ghostLines before drawing
        this._ghostLines = {};
        this._drawGhostConnections();
        this._drawExistingConnections();

        this._buildStatusBar();
        this._bgLayer.add(this.children.list.slice(-4)); // Add status bar to bgLayer

        // Tutorial overlay for first-time visitors who actually have nodes to connect
        if (!this.state.contextualTutorialSeen && this.state.boardNodes.length >= 3) {
            this._startContextualTutorial();
        } else if (this.state.boardNodes.length === 0) {
            this._showToast('Investigate cards first to unlock clues.');
        }

        // Input handler to deselect node if tapping empty space
        this.input.on('pointerdown', (pointer, gameObjects) => {
            if (gameObjects.length === 0 && this._selected) {
                this._selected.deselect();
                this._selected = null;
            }
        });
    }

    // Fade out using the same pattern as CardScene
    _fadeToScene(key, data = {}) {
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(key, data);
        });
    }

    _drawGhostConnections() {
        // Determine which pairs of unlocked nodes form valid connections
        const unlockedList = Object.values(this._nodes).filter(n => n.isUnlocked).map(n => n.nodeData.id);

        for (let i = 0; i < unlockedList.length; i++) {
            for (let j = i + 1; j < unlockedList.length; j++) {
                const id1 = unlockedList[i];
                const id2 = unlockedList[j];

                // Don't draw if already connected by player
                const exists = this.state.connections.find(
                    c => (c.fromId === id1 && c.toId === id2) ||
                        (c.fromId === id2 && c.toId === id1)
                );
                if (exists) continue;

                // Is it a valid pair according to boardData?
                const isValid = this.boardData.validConnections.some(
                    ([a, b]) => (a === id1 && b === id2) || (a === id2 && b === id1)
                );

                if (isValid) {
                    const n1 = this._nodes[id1];
                    const n2 = this._nodes[id2];

                    const gfx = this.add.graphics();
                    // [v4] Ghost lines use custom dashed utility
                    gfx.lineStyle(1, 0xFFFFFF, 0.12);
                    drawDashedLine(gfx, n1.x, n1.y, n2.x, n2.y, 4, 6);
                    this._ghostLayer.add(gfx);

                    // Store reference so we can destroy it when the player makes the final connection
                    const key = [id1, id2].sort().join('_');
                    this._ghostLines[key] = gfx;
                }
            }
        }
    }

    _clearGhostLine(id1, id2) {
        const key = [id1, id2].sort().join('_');
        if (this._ghostLines[key]) {
            this._ghostLines[key].destroy();
            delete this._ghostLines[key];
        }
    }

    _startContextualTutorial() {
        // [v6] Interactive tutorial: locks input to only the required nodes
        this._tutorialPhase = 1;

        // Find two valid nodes to connect
        const unlocked = Object.values(this._nodes).filter(n => n.isUnlocked).map(n => n.nodeData.id);
        let targetA, targetB;
        for (let i = 0; i < unlocked.length; i++) {
            for (let j = i + 1; j < unlocked.length; j++) {
                const isValid = this.boardData.validConnections.some(
                    ([a, b]) => (a === unlocked[i] && b === unlocked[j]) || (a === unlocked[j] && b === unlocked[i])
                );
                if (isValid) {
                    targetA = this._nodes[unlocked[i]];
                    targetB = this._nodes[unlocked[j]];
                    break;
                }
            }
            if (targetA) break;
        }

        if (!targetA || !targetB) {
            this.state.contextualTutorialSeen = true;
            return;
        }

        this._tutA = targetA;
        this._tutB = targetB;

        // Dim everything else
        this._tutDim = this.add.rectangle(SIZES.W / 2, SIZES.H / 2, SIZES.W, SIZES.H, 0x000000, 0.75);
        this._bgLayer.add(this._tutDim);

        // Bring targets above dim
        this._nodesLayer.bringToTop(this._tutA);
        this._nodesLayer.bringToTop(this._tutB);

        this._tutText = this.add.text(SIZES.W / 2, SIZES.H - 180, 'Tap a clue to start a connection.', {
            fontFamily: 'Playfair Display', fontSize: '18px', color: '#F5C518', fontStyle: 'italic', align: 'center'
        }).setOrigin(0.5);
        this._bgLayer.add(this._tutText);

        // Lock all clicks except targetA and targetB
        Object.values(this._nodes).forEach(n => {
            if (n !== this._tutA && n !== this._tutB) {
                n.disableInteractive();
            }
        });

        // Add a pulsing ring around targetA
        this._tutRing = this.add.graphics();
        this._tutRing.lineStyle(2, COLORS.YELLOW, 1);
        this._tutRing.strokeCircle(this._tutA.x, this._tutA.y, 24);
        this._nodesLayer.add(this._tutRing);
        this.tweens.add({
            targets: this._tutRing, scaleX: 1.5, scaleY: 1.5, alpha: 0,
            duration: 1000, repeat: -1
        });
    }

    _advanceTutorial(step) {
        if (!this._tutorialPhase) return;

        if (step === 'selected_first') {
            this._tutorialPhase = 2;
            this._tutText.setText('Now tap the matching clue to link them.');
            this._tutRing.x = this._tutB.x - this._tutA.x;
            this._tutRing.y = this._tutB.y - this._tutA.y;
        } else if (step === 'connected') {
            this._tutorialPhase = 3;
            this._tutRing.destroy();
            this._tutText.setText('Strong (Green) links are real evidence.\nConnect 5 clues with 3 Strong links to publish.');

            const btn = this.add.text(SIZES.W / 2, SIZES.H - 120, 'GOT IT →', { ...FONTS.BUTTON })
                .setOrigin(0.5).setInteractive({ useHandCursor: true });
            this._bgLayer.add(btn);

            btn.on('pointerdown', () => {
                this._tutDim.destroy();
                this._tutText.destroy();
                btn.destroy();
                this.state.contextualTutorialSeen = true;
                this.state.save();
                this._tutorialPhase = null;

                // Restore interactivity
                Object.values(this._nodes).forEach(n => {
                    if (n.isUnlocked) n.setInteractive({ useHandCursor: true });
                });
            });
        }
    }

    _buildHeader() {
        this.add.rectangle(SIZES.W / 2, 30, SIZES.W, BOARD_OFFSET_Y, COLORS.PANEL);
        const border = this.add.graphics();
        border.lineStyle(1, COLORS.YELLOW, 0.5);
        border.lineBetween(0, BOARD_OFFSET_Y, SIZES.W, BOARD_OFFSET_Y);

        // Back button
        const back = this.add.text(20, 30, '← BACK', FONTS.BUTTON)
            .setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        back.on('pointerdown', () => {
            this._fadeToScene('CardScene', { gameState: this.state });
        });

        this.add.text(SIZES.W / 2, 30, '🗺 CONSPIRACY BOARD', { ...FONTS.BUTTON, align: 'center' })
            .setOrigin(0.5);
    }

    _buildBoardBackground() {
        // Base rectangle
        this.add.rectangle(
            SIZES.W / 2,
            BOARD_OFFSET_Y + SIZES.BOARD_H / 2,
            SIZES.W,
            SIZES.BOARD_H,
            0x1C1410
        );

        // CORKBOARD TEXTURE — dot grid pattern to suggest pinboard aesthetic
        const texture = this.add.graphics();
        const dotColor = 0x2A1E14;
        const dotAlpha = 0.8;
        const spacing = 18;
        for (let x = spacing; x < SIZES.W; x += spacing) {
            for (let y = BOARD_OFFSET_Y + spacing; y < BOARD_OFFSET_Y + SIZES.BOARD_H; y += spacing) {
                texture.fillStyle(dotColor, dotAlpha);
                texture.fillCircle(x, y, 1);
            }
        }

        // Subtle vignette: darker edges to focus attention on center nodes
        const vignette = this.add.graphics();
        const edgeAlpha = 0.35;
        // Left edge
        for (let i = 0; i < 40; i++) {
            vignette.fillStyle(0x000000, edgeAlpha * (1 - i / 40));
            vignette.fillRect(i, BOARD_OFFSET_Y, 1, SIZES.BOARD_H);
        }
        // Right edge
        for (let i = 0; i < 40; i++) {
            vignette.fillStyle(0x000000, edgeAlpha * (1 - i / 40));
            vignette.fillRect(SIZES.W - i - 1, BOARD_OFFSET_Y, 1, SIZES.BOARD_H);
        }
    }

    _buildNodes() {
        this.boardData.nodes.forEach(nodeData => {
            const isUnlocked = this.state.boardNodes.includes(nodeData.id);
            const node = new NodeObject(
                this,
                { ...nodeData, x: nodeData.x, y: nodeData.y + BOARD_OFFSET_Y },
                isUnlocked
            );

            // [v5] Add to _nodesLayer so nodes always render above connection lines (depth 1)
            this._nodesLayer.add(node);

            if (isUnlocked && !nodeData.locked) {
                node.on('pointerdown', () => this._onNodeTap(node));
            }

            // [v5] Locked centre node: render at 25% opacity with [LOCKED] label until 4 others connected
            if (nodeData.locked) {
                node.setAlpha(0.25);
                node._label.setText('[LOCKED]');
            }

            this._nodes[nodeData.id] = node;
        });
    }

    // [v5] Called after every connection — unlocks MAYOR node when 4 other nodes are connected
    _checkCentreUnlock() {
        const centreId = 'MAYOR';
        const centreNode = this._nodes[centreId];
        if (!centreNode || centreNode.isUnlocked) return;

        const connectedOthers = new Set(
            this.state.connections
                .filter(c => c.strength !== 'dead_end')
                .flatMap(c => [c.fromId, c.toId])
                .filter(id => id !== centreId)
        ).size;

        if (connectedOthers >= 4) {
            // Add to boardNodes so it can participate in connections
            if (!this.state.boardNodes.includes(centreId)) {
                this.state.boardNodes.push(centreId);
            }
            centreNode.unlock();
            centreNode._label.setText(this.boardData.nodes.find(n => n.id === centreId)?.label || centreId);
            centreNode.on('pointerdown', () => this._onNodeTap(centreNode));
            this.state.save();
            this._showToast('The centre clue is now unlocked!');
            this._drawGhostConnections();
        }
    }

    _drawExistingConnections() {
        // Redraw any connections already in gameState (player may have visited board before)
        this.state.connections.forEach(conn => {
            const from = this._nodes[conn.fromId];
            const to = this._nodes[conn.toId];
            if (from && to) {
                this._connections.push(new ConnectionLine(this, from, to, conn.strength));
            }
        });
    }

    _buildStatusBar() {
        const y = BOARD_OFFSET_Y + SIZES.BOARD_H;
        this.add.rectangle(SIZES.W / 2, y + 40, SIZES.W, 80, COLORS.PANEL);
        const border = this.add.graphics();
        border.lineStyle(1, COLORS.YELLOW, 0.5);
        border.lineBetween(0, y, SIZES.W, y);

        // Show both win conditions explicitly so player always knows what's needed
        this._connectedText = this.add.text(16, y + 12, '', { ...FONTS.METER, align: 'left' });
        this._strongText = this.add.text(16, y + 30, '', { ...FONTS.STAMP, align: 'left' });
        this._winHintText = this.add.text(16, y + 50, 'WIN: 5 nodes + 3 strong connections', {
            ...FONTS.STAMP, color: '#666666'
        });

        // Publish button — starts inactive, activates on win
        this._publishBtn = this.add.text(SIZES.W - 20, y + 28, 'PUBLISH →', { ...FONTS.BUTTON })
            .setOrigin(1, 0.5).setAlpha(0.3);

        this._updateStatusBar();
    }

    _updateStatusBar() {
        const valid = this.state.connections.filter(c => c.strength !== 'dead_end');
        const covered = new Set(valid.flatMap(c => [c.fromId, c.toId])).size;
        const strong = valid.filter(c => c.strength === 'strong').length;

        // Color-code progress: grey = not met, green = met
        this._connectedText.setText(`NODES: ${covered}/5`);
        this._connectedText.setColor(covered >= 5 ? '#4A8A6A' : '#F5F0E8');
        this._strongText.setText(`STRONG: ${strong}/3`);
        this._strongText.setColor(strong >= 3 ? '#4A8A6A' : '#F5F0E8');

        if (checkWin(this.state)) {
            this._winHintText.setText('✓ READY TO PUBLISH').setColor('#4A8A6A');
            this._publishBtn.setAlpha(1).setInteractive({ useHandCursor: true });
            this._publishBtn.off('pointerdown');
            this._publishBtn.on('pointerdown', () => {
                this._fadeToScene('ResultsScene', { gameState: this.state });
            });
            this.tweens.add({
                targets: this._publishBtn, alpha: { from: 0.6, to: 1 },
                duration: 500, yoyo: true, repeat: -1
            });
        }
    }

    _onNodeTap(tappedNode) {
        if (!tappedNode.isUnlocked) return;

        if (!this._selected) {
            // Nothing selected yet — select this node
            this._selected = tappedNode;
            tappedNode.select();

            if (this._tutorialPhase === 1) {
                this._advanceTutorial('selected_first');
            }

            // Pulse all other unlocked nodes as targets
            Object.values(this._nodes).forEach(n => {
                if (n !== tappedNode && n.isUnlocked) n.pulse();
            });

        } else if (this._selected === tappedNode) {
            // Tapped the same node — deselect
            this._selected.deselect();
            this._selected = null;

        } else {
            // Two different nodes selected — attempt connection
            const fromId = this._selected.nodeData.id;
            const toId = tappedNode.nodeData.id;
            const strength = evaluateConnection(fromId, toId, this.state, this.boardData);

            // Check not already connected
            const alreadyExists = this.state.connections.find(
                c => (c.fromId === fromId && c.toId === toId) ||
                    (c.fromId === toId && c.toId === fromId)
            );

            this._selected.deselect();
            this._selected = null;

            if (alreadyExists) {
                this._showToast('Already connected.');
                return;
            }

            // Add to state and draw
            this.state.addConnection(fromId, toId, strength);
            const line = new ConnectionLine(this, this._nodes[fromId], this._nodes[toId], strength);
            this._connectionsLayer.add(line._gfx); // [v5] keep connections below nodes
            this._connections.push(line);
            this._clearGhostLine(fromId, toId);
            this.state.save();

            if (strength === 'dead_end') {
                this._showToast('No evidence links these — dead end (−5pts)');
            }

            if (this._tutorialPhase === 2) {
                this._advanceTutorial('connected');
            }

            this._checkCentreUnlock(); // [v5] check if MAYOR unlocks after this connection
            this._updateStatusBar();
        }
    }

    _showToast(message) {
        const t = this.add.text(SIZES.W / 2, BOARD_OFFSET_Y + SIZES.BOARD_H - 20, message, {
            ...FONTS.STAMP, align: 'center', backgroundColor: '#1A1208', padding: { x: 12, y: 6 }
        }).setOrigin(0.5, 1);
        this.tweens.add({ targets: t, alpha: 0, duration: 1500, delay: 800, onComplete: () => t.destroy() });
    }
}
