game.import('extension', function (lib, game, ui, get, ai, _status) {
    const internals = {
        panel: {
            node: null,
            orbList: {
                node: null,
                gainOrbs(orbs) {
                    this.newOrbs = this.newOrbs || [];
                    this.newOrbs.push(orbs);
                },
                newOrbs: null,
            }
        },
        async show() {
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
            this.panel.node = mainPanel;
            // show loading text
            this.config.skillRequirement = await this.config.skillRequirement;
            this.start();
            // lib.setHover(mainPanel, () => {});
            // const idb = await import('./modules/index.js');
        },
        config: {
            skillRequirement: null,
            mixProbability: [
                [0.88, 0.12, 0, 1, 0, 0],
                [0.3, 0.6, 0.1, 0, 1, 0],
                [0, 0.4, 0.6, 0, 0, 1],
                [1, 0, 0, 0.98, 0.02, 0],
                [0.5, 0.5, 0, 0, 0.9, 0.1],
                [0, 0.5, 0.5, 0, 0, 1],
            ],
            coeffMap: {
                sp: 0.05,
                s: 0.15,
                ap: 0.25,
                a: 0.40,
                am: 0.55,
                bp: 0.70,
                b: 0.80,
                bm: 0.90,
                c: 0.95,
                d: 1.00,
                x: 0.30,
            },
        },
        async save() {
            if (this._isSaving) {
                return;
            }
            this._isSaving = true;
            await localStorage.setItem('bujiang', JSON.stringify(this.data));
            this._isSaving = false;
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
                 * [skillName2, count2]?,
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
         * @param {[[String?, String?, String?],[String?, String?, String?],[String?, String?, String?]]} suit 
         */
        report(suit) {
            // if (suit.flat().some(id => id && !this.data.orbs[id])) {
            //     return false;
            // }
            let orbData = [[], [], []];
            for (let [i, v] of suit.entries()) {
                for (let [j, w] of v.entries()) {
                    orbData[i][j] = this.data.orbs[w];
                }
            }
            // console.log(orbData);
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
                solve([orbData[0][i], orbData[1][i], orbData[2][i]]);
            }
            solve([orbData[0][0], orbData[1][1], orbData[2][2]]);
            solve([orbData[0][2], orbData[1][1], orbData[2][0]]);
            let unfulfilledSkills = [];
            for (let sk of result.skills) {
                let req = this.getSkillRequirement(sk);
                if (req.some((rn, i) => rn > result.colors[i])) {
                    unfulfilledSkills.push(sk);
                }
            }
            result.skills.removeArray(unfulfilledSkills);
            return result;
        },
        getSkillRequirement(name) {
            let temp = this.config.skillRequirement[name];
            if (temp) {
                return temp;
            }
            /** TODO: refine */
            temp = [0, 0, 0, 0];
            let gp = new Set();
            for (const i in lib.character) {
                const info = lib.character[i];
                if (info[3].includes(name)) {
                    gp.add(info[1]);
                }
            }
            if (gp.has('shu')) temp[0] += 1;
            if (gp.has('qun')) temp[1] += 1;
            if (gp.has('wu')) temp[2] += 1;
            if (gp.has('wei')) temp[3] += 1;
            if (gp.has('jin')) temp[3] += 1;
            this.config.skillRequirement[name] = temp;
            return temp;
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
        _getTier(color, cnt) {
            if (color !== 0) {
                if (cnt === 4) return 2;
                else if (cnt === 3) return 1;
                else return 0;
            } else {
                if (cnt >= 8) return 5;
                else if (cnt > 6) return 4;
                else return 3;
            }
        },
        _resolveTier(tier) {
            switch (tier) {
                case 5:
                    return [8, 9].randomGet();
                case 4:
                    return [6, 7].randomGet();
                case 3:
                    return [3, 4, 5].randomGet();
                case 2:
                    return 4;
                case 1:
                    return 3;
                case 0:
                    return [1, 2].randomGet();
                default:
                    break;
            }
        },
        /**
         * compose 3 orbs, (skill1, skill2, target)
         * @param {[String, String, String]} orbs 
         */
        mixOrb(orbs) {
            let orbData = orbs.map(o => this.data.orbs[o]);
            if (orbData.some(o => !o)) {
                throw 'orb not found while mixing';
            }
            let newOrb = [orbData[2][0], orbData[2][1]];
            {
                let tier = this._getTier(orbData[0][0], orbData[0][2][1]);
                let dist = this.config.mixProbability[tier];
                if (newOrb[0] === 0) {
                    dist[0] = dist[1] = dist[2] = 0;
                } else {
                    dist[3] = dist[4] = dist[5] = 0;
                }
                let newTier = this.utils.distributionGet(dist);
                let newNum = this._resolveTier(newTier);
                newOrb.push([orbData[0][2][0], newNum]);
            }
            if (orbData[1][3] && orbData[1][3][0] !== orbData[0][2][0]) {
                let tier = this._getTier(orbData[1][0], orbData[1][3][1]);
                let dist = this.config.mixProbability[tier];
                if (newOrb[0] === 0) {
                    dist[0] = dist[1] = dist[2] = 0;
                } else {
                    dist[3] = dist[4] = dist[5] = 0;
                }
                let newTier = this.utils.distributionGet(dist);
                let newNum = this._resolveTier(newTier);
                newOrb.push([orbData[1][3][0], newNum]);
            }
            let [id] = this.gainOrbs([newOrb]);
            this.removeOrbs(orbs, { newID: id });
            return id;
        },
        gameOver(result) {
            if (_status.video) return;
            let resolveRewards = () => {
                let result = [];
                let me = game.me._trueMe || game.me;
                let coeff1, coeff2 = 0;
                coeff1 = this.config.coeffMap[get.rank(me.name1)];
                if (me.name2) {
                    coeff2 = this.config.coeffMap[get.rank(me.name2)];
                    coeff1 /= 2;
                    coeff2 /= 2;
                }
                if (me.getAllHistory('useCard').length < 5) {
                    coeff1 /= 4;
                    coeff2 /= 4;
                } else {
                    if (result) {
                        coeff1 *= 2;
                        coeff2 *= 2;
                    }
                }
                let cnt1 = 0, cnt2 = 0, revive = true;
                while (true) {
                    let win1 = coeff1 && Math.random() < coeff1;
                    let win2 = coeff2 && Math.random() < coeff2;
                    if (win1) {
                        ++cnt1;
                        coeff1 /= (cnt + 1);
                    }
                    if (win2) {
                        ++cnt2;
                        coeff2 /= (cnt + 1);
                    }
                    if (!cnt1 && !cnt2 && revive) {
                        revive = false;
                        continue;
                    }
                    if (!win1 && !win2) {
                        break;
                    }
                }
                if (!this._allSkills) {
                    let skills = [];
                    for (let c in lib.character) {
                        if (lib.filter.characterDisabled(c))continue;
                        for (let sk of lib.character[c][3]) {
                            if (lib.skill[sk] && !lib.skill[sk].zhuSkill && !lib.skill[sk].juexingji && !lib.skill[sk].unique &&
                                lib.translate[sk] && lib.translate[sk+'_info'])
                                skills.push(sk);
                        }
                    }
                    this._allSkills = skills;
                }
                let skills = lib.character[me.name1][3].filter(s => this._allSkills.includes(s));
                let addOrb = (cnt, skills) => {
                    while (cnt) {
                        --cnt;
                        // only skill, skill at 1, skill at 2
                        let skillType = this.utils.distributionGet([0.5, 0.2, 0.3]);
                        let names = [skills.randomGet() || this._allSkills.randomGet()];
                        let name2 = this._allSkills.randomGet();
                        if (skillType == 2) {
                            names.unshift(name2);
                        } else if (skillType == 1) {
                            names.push(name2);
                        }
                        result.push(this.generateRandomOrb(...names));
                    }
                }
                addOrb(cnt1, skills);
                if (me.name2) {
                    skills = lib.character[me.name2][3].filter(s => this._allSkills.includes(s));
                    addOrb(cnt2, skills);
                }
                return result;
            };
            let rewards = resolveRewards();
            this.gainOrbs(rewards);
        },
        generateRandomOrb(name1, name2) {
            // color
            let newOrb = [get.rand(5)]
            // type
            newOrb.push(this.utils.distributionGet([0.4, 0.2, 0.2, 0.2]));
            let tier = this.utils.distributionGet([0.75, 0.2, 0.05]) + (newOrb[0] == 0 ? 3 : 0);
            newOrb.push([name1, this._resolveTier(tier)]);
            if (name2 && name2 != name1) {
                let tier = this.utils.distributionGet([0.75, 0.2, 0.05]) + (newOrb[0] == 0 ? 3 : 0);
                newOrb.push([name2, this._resolveTier(tier)]);
            }
            return newOrb;
        },
        removeOrbs(orbs, args) {
            // update suits
            for (let id of orbs) {
                delete this.data.orbs[id];
            }
            args.newID = args.newID || null;
            for (let suit of this.data.suits) {
                let used = false;
                for (let row of suit.orbs) {
                    for (let [i, o] of row.entries()) {
                        if (orbs.contains(o)) {
                            if (used) {
                                row[i] = null;
                            } else {
                                row[i] = args.newID;
                                used = true;
                            }
                        }
                    }

                }
            }
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
            this.panel.orbList.gainOrbs(ids);
            this.save();
            return ids;
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
        utils: {
            /**
             * 
             * @param {Array<Number>} dist 
             * @returns {Number}
             */
            distributionGet(dist) {
                var res = Math.random();
                let sum = dist.reduce((a, b) => a + b);
                dist = dist.map(v => v / sum);
                for (let i = 0; ;) {
                    if (res < dist[i]) return i;
                    res -= dist[i];
                    ++i;
                }
            },
        }
    };
    return {
        name: '部将',
        content: function (config, pack) {
            internals.config.skillRequirement = new Promise((resolve, reject) => {
                lib.init.json(
                    lib.assetURL + 'extension/部将/skillRequirement.json',
                    o => resolve(o),
                    () => reject()
                );
            });
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
            let over = game.over;
            game.over = function (result) {
                over.apply(this, arguments);
                internals.gameOver(result); // make async?
            }
            // debug
            window.bujiangI = internals;
            bujiangI.config.skillRequirement.then(o => { bujiangI.config.skillRequirement = o; });
            bujiangI.setupData();
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
            部将区别: `
与原生部将区别：<br>
没有位置限制<br>
不需要完成成就就可以获得珠子。双将获得的珠子会略微比单将多一点，平摊到两个武将上。<br>
多套左幽可以共用珠子<br>
`
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