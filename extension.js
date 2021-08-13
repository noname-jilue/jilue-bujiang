game.import('extension', function (lib, game, ui, get, ai, _status) {
    const internals = {
        show() {
            console.log('bujiang show');
            if (_status.dragged) return;
            ui.click.touchpop();
            {
                /** dim background */
                if (lib.config.theme != 'simple') {
                    ui.window.classList.add('shortcutpaused');
                    ui.menuContainer.classList.add('forceopaque');
                }
                else {
                    ui.window.classList.add('systempaused');
                    ui.menuContainer.classList.add('transparent2');
                }
                if (lib.config.blur_ui) {
                    ui.arena.classList.add('blur');
                    ui.system.classList.add('blur');
                    ui.menuContainer.classList.add('blur');
                }
            }
            const layer = ui.create.div('.popup-container');
            layer.addEventListener('pointerup', evt => {
                if (_status.touchpopping) return;
                if (_status.dragged) return;
                ui.window.classList.remove('shortcutpaused');
                ui.window.classList.remove('systempaused');
                ui.menuContainer.classList.remove('forceopaque');
                ui.menuContainer.classList.remove('transparent2');
                ui.arena.classList.remove('blur');
                ui.system.classList.remove('blur');
                ui.menuContainer.classList.remove('blur');
                evt.currentTarget.delete();
                delete this.panel;
                evt.stopPropagation();
                // if(resume) game.resume2();
                return false;
            });
            window.layer = layer;
            ui.window.appendChild(layer);
            const mainPanel = ui.create.div('.menubg.jlsgbujiang', layer);
            mainPanel.addEventListener('pointerup', ui.click.touchpop);
            this.panel = {
                node: mainPanel,
            }
            this.start();
            // lib.setHover(mainPanel, () => {});
            // const idb = await import('./modules/index.js');
        },
        async save() {
            if (this._isSaving) {

                return;
            }
            localStorage.setItem('bujiang', JSON.stringify(this.data));
        },
        start() {
            this.setupData();
            if (this.data.states.needInitialGive) {
                // await Give a random list of orbs
                /** [
                 *      Color: 0 purple,
                 *             1 shu,
                 *             2 qun,
                 *             3 wu,
                 *             4 wei,
                 *      type:  0 | 1(STR) | 2(AGI) | 3(INT)
                 * [skillName, count],
                 * [skillName2, count2] | null,
                 * ] */
                let gifts = [
                    [1, 1, ['rende', 4], ['paoxiao', 3]],
                    [1, 1, ['rende', 4], ['paoxiao', 3]],
                    [1, 1, ['rende', 4]],
                ]
                this.gainOrbs(gifts);
                this.data.states.needInitialGive = false;
                this.save();
            }
            if (this.bonusReady) {
                // alert daily bonus
            }
        },
        /**
         * give status of the given suit
         * @param {[[string?, string?, string?],[string?, string?, string?],[string?, string?, string?]]} suit 
         */
        report(suit) {
            if (suit.flat().some(id => id && !this.data.orbs[id])) {
                return false;
            }
            let orbData = [[], [], []];
            for (let [i, v] of suit.entries()) {
                for (let [j, w] of v.entries()) {
                    orbData[i][j] = this.data.orbs[w];
                }
            }
            console.log(orbData);
            let result = {
                colors: [0, 0, 0, 0],
                types: 0,
                skills: [],
            }
            let solve = orbs => {
                if (orbs.some(o => !o)) {
                    return;
                }
                let color;
                let skills = {};
                for (o of orbs) {
                    // color
                    if (o[0] && color !== false) {
                        if (color && color !== o[0]) {
                            color = false;
                        } else {
                            color = o[0];
                        }
                    }
                    // skill
                    let addSkill = ([name, cnt]) => {
                        skills[name] = skills[name] || 0;
                        skills[name] += cnt;
                    };
                    addSkill(o[2]);
                    if (o[3]) {
                        addSkill(o[3]);
                    }
                }
                if (color) {
                    ++result.colors[color - 1];
                }
                if (orbs[0][1] && orbs.every(o => o[1] === orbs[0][1])) {
                    result.types = orbs[0][1];
                }
                for (let s in skills) {
                    if (skills[s] >= 10) {
                        result.skills.push(s);
                    }
                }
            };
            for (let i of [0, 1, 2]) {
                solve(orbData[i]);
                solve([orbData[0][i],orbData[1][i],orbData[2][i]]);
            }
            solve([orbData[0][0], orbData[1][1],orbData[2][2]]);
            solve([orbData[0][2], orbData[1][1],orbData[2][0]]);
            /** FIXME: implement color requirements */
            return result;
        },
        get bonusReady() {
            /** FIXME: move to daily bonus module as sub function */
            this.setupData();
            if (!this.data.bonusDay) {
                return true;
            }
            let lastDay = new Date(this.data.bonusDay);
            let tday = new Date();
            tday = Date.UTC(tday.getFullYear(), tday.getMonth(), tday.getDate());
            lastDay = Date.UTC(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate());
            return tday > lastDay;
        },
        getBonus() {
            // TODO: fix, move to sub module
            this.data.bonusDay = Date.now();
            this.save();
        },
        gainOrbs(orbs) {
            if (Array.isArray(orbs)) {
                var ids = [];
                for (let orb of orbs) {
                    // orb = {...orb};
                    let orbID = this.makeid(5, true);
                    ids.push(orbID);
                    this.data.orbs[orbID] = orb;
                }
            } else {
                ids = Object.keys(orbs);
                Object.assign(this.data.orbs, orbs);
            }
            this.orbList && this.orbList.gainOrbs(ids);
            this.save();
        },
        setupData() {
            if (this.data) {
                return;
            }
            let data = localStorage.getItem('bujiang')
            if (data) {
                this.data = JSON.parse(data)
            }
            if (!this.data || this.data.cheater) {
                this.data = {
                    suits: [
                        {
                            name: '默认',
                            orbs: [
                                [null, null, null],
                                [null, null, null],
                                [null, null, null],
                            ],
                        }
                    ],
                    orbs: {},
                    states: {
                        needInitialGive: true,
                    }
                }
                this.save();
            }
        },
        makeid(length, noDup = false) {
            var result = '';
            var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            for (var i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() *
                    charactersLength));
            }
            // if (noDup && this.data,orbs[result]) {
            //     return this.makeid(length, true);
            // }
            return result;
        },
    };
    return {
        name: '部将',
        content: function (config, pack) {
            window._bujiang = {
                show() {
                    internals.show();
                }
            }
            if (config.shortcut) {
                lib.arenaReady.push(() => {
                    ui.config2.addEventListener('pointerup', evt => {
                        if (evt.currentTarget.classList.contains('hidden')) {
                            return;
                        }
                        setTimeout(() => {
                            document.querySelector('.menu-tab :nth-child(5)').addEventListener('pointerup', evt => {
                                var cNode = evt.currentTarget;
                                if (!cNode._doubleClicking) {
                                    cNode._doubleClicking = true;
                                    setTimeout(function () {
                                        cNode._doubleClicking = false;
                                    }, 500);
                                    return;
                                }
                                // ui.click.skin(this,player.name);
                                internals.show();
                            });
                        });
                    });
                })
            }
            // debug
            window.bujiangI = internals;
        },
        precontent: function (config) {
            if (!config.enable) {
                return;
            }
            lib.init.css(lib.assetURL + 'extension/' + _status.extension, 'style');
        },
        config: {
            shortcut: {
                name: "快捷键",
                get intro() {
                    return lib.device ? '长按选项→拓展打开部将界面' : '双击选项→拓展打开部将界面';
                },
                init: true,
            },
        },
        help: {

        },
        package: {
            character: {
                character: {
                },
                translate: {
                },
            },
            card: {
                card: {
                },
                translate: {
                },
                list: [],
            },
            skill: {
                skill: {
                },
                translate: {
                },
            },
            intro: `\
是的,没错。部将。<br>
<a class="jlsgbujiang" onclick="if (_bujiang) _bujiang.show()">
打开部将</a><br>
`,
            author: 'xiaoas',
            diskURL: '',
            forumURL: '',
            version: '0.1',
        }, files: { character: [], card: [], skill: [] }
    }
})