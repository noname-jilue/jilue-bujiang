game.import('extension', function (lib, game, ui, get, ai, _status) {
    /** without ending slash! */
    const assetURL = lib.assetURL + 'extension/部将';
    const internals = {
        panel: {
            node: null,
            _makeOrb(orbData) {
                /** TODO: make empty orb */
                let orb = document.createElement("div");
                orb.classList.add('orb', 'jlsgbujiang');
                let img = document.createElement("img"); orb.appendChild(img);
                if (!orbData) {
                    orb.classList.add('empty');
                    img.src = assetURL;
                    return;    
                }
                img.src = assetURL + `/zz/color/${orbData[0]}.png`;
                if (orbData[1]) {
                    let mark = document.createElement("img"); orb.appendChild(mark);
                    // mark.classList.add('orb', 'jlsgbujiang');
                    mark.style.zIndex = 1;
                    // mark.classList.add('orb', 'jlsgbujiang');
                    mark.src = assetURL + `/zz/type/${orbData[0]}_${orbData[1]}.png`;
                }
                return orb;
            },
            orbList: {
                get node() {
                    /** FIXME: rewrite with Intersection Observer API!!! */
                    delete this.node;
                    internals.setupData();
                    let node = document.createElement("div");
                    node.classList.add('orblist', 'jlsgbujiang');
                    for (let id of internals.data.newOrbs) {
                        if (internals.data.orbs[id]) {
                            let disc = this._makeOrbDesc(id);
                            node.prepend(disc.node);
                        }
                    }
                    for (let id in internals.data.orbs) {
                        if (internals.data.newOrbs.contains(id)) {
                            continue;
                        }
                        let disc = this._makeOrbDesc(id);
                        node.appendChild(disc.node);
                    }
                    this.node = node;
                    return this.node;
                },
                gainOrbs(orbs) {
                    internals.data.newOrbs.push(...orbs);
                    if (this.node) {
                        for (let id of orbs) {
                            if (internals.data.orbs[id]) {
                                let disc = this._makeOrbDesc(id);
                                this.node.prepend(disc.node);
                            }
                        }
                    }
                    internals.save();
                },
                _makeOrbDesc(orbID) {
                    let data = internals.data.orbs[orbID];
                    if (!data) return;
                    let node = document.createElement("div");
                    node.classList.add('orbdesc', 'jlsgbujiang', 'menubg'); //'popup-container'
                    if (internals.data.newOrbs.contains(orbID)) {
                        let redDot = document.createElement("div");
                        redDot.classList.add('reddot', 'jlsgbujiang');
                        node.appendChild(redDot);
                        node.addEventListener('mouseenter', e => {
                            node.querySelector('.reddot').style.opacity = 0;
                            internals.data.newOrbs.remove(orbID);
                            internals.save();
                        });
                    }
                    let orb = internals.panel._makeOrb(data); node.appendChild(orb);

                    let textBox = document.createElement("div"); node.appendChild(textBox);
                    textBox.classList.add('desctextbox', 'jlsgbujiang');
                    // TODO: add right click popup & always show requirement toggle
                    let str1 = lib.translate[data[2][0] + '_ab'] || lib.translate[data[2][0]];
                    str1 = str1.slice(0, 2) + '+' + data[2][1];
                    let desc1 = document.createElement("span"); textBox.appendChild(desc1);
                    desc1.classList.add('desctext');
                    desc1.innerText = str1;
                    // middle line
                    let midLine = document.createElement("div"); textBox.appendChild(midLine);
                    midLine.classList.add('line');
                    let str2 = "&nbsp;";
                    if (data[3]) {
                        str2 = lib.translate[data[3][0] + '_ab'] || lib.translate[data[3][0]];
                        str2 = str2.slice(0, 2) + '+' + data[3][1];
                    }
                    let desc2 = document.createElement("span"); textBox.appendChild(desc2);
                    desc2.classList.add('desctext');
                    desc2.innerHTML = str2;
                    return {
                        node: node,
                        id: orbID,
                        orb: orb,
                    }
                },
                newOrbs: null,
            },
            suitDisk: {
                // node: null, // maybe no global one?
                init(data, interactive) {
                    node = document.createElement("div");
                    node.classList.add('suitdisk', 'jlsgbujiang');
                    let children = [[], [], []];
                    for (let i of Array(3).keys()) {
                        for (let j of Array(3).keys()) {
                            let orb = data.orbs[i][j], orbNode;
                            if (!orb || !internals.data.orbs[orb]) {
                                orbNode = document.createElement("div");
                                orbNode.classList.add('orb', 'jlsgbujiang');
                            } else {
                                orbNode = internals.panel._makeOrb(internals.data.orbs[orb]);
                                orbNode.addEventListener('click', e => {
                                    // TODO: update orbs in use
                                    if (game.getExtensionConfig('部将', 'quickSwap')) {
                                        node.replaceChild(document.createElement("div"), orbNode);
                                    } else {
                                        // create action list tip
                                        throw 'not implemented';
                                    }
                                })
                            }
                            children[i].push(orbNode);
                            node.appendChild(orbNode);
                        }
                    }
                    return {
                        node: node,
                        name: interactive ? data.name : null,
                        orbs: children,
                    }
                },
            },
            suitPage: {
                node: null,
                suit: null,
                suitDesc: {
                    node: null,
                    hpNode: null,
                    typesNode: null,
                    skill: {
                        node: null,
                        skills: {},
                    },
                    init() {
                        this.node = document.createElement("div");
                        this.node.classList.add('suitdesc', 'jlsgbujiang');
                        this.hpNode = document.createElement("div");
                        this.hpNode.style.cssText = 'transition: all 1s';
                        this.hpNode.classList.add('hp');
                        this.hpNode.dataset.condition = 'high';
                        this.typesNode = document.createElement("div");
                        this.typesNode.style.cssText = 'transition: all 1s';
                        this.typesNode.classList.add('types', 'jlsgbujiang');
                        for (let i = 1; i <= 3; ++i) {
                            let mark = document.createElement("img"); this.typesNode.appendChild(mark);
                            mark.src = assetURL + `/zz/type/1_${i}.png`;
                            mark.classList.add('invalid');
                        }
                        this.skill.node = document.createElement("div");
                        this.skill.node.style.cssText = 'transition: all 1s';
                        this.skill.node.classList.add('types', 'jlsgbujiang');
                        this.node.append('体力：');
                        this.node.appendChild(this.hpNode);
                        this.node.appendChild(document.createElement('br'));
                        this.node.append('灵力：');
                        this.node.appendChild(this.typesNode);
                        this.node.appendChild(document.createElement('br'));
                        this.node.append('技能：'); // report.skills.map(s => lib.translate[s]).reduce((a, b) => a + ' ' + b, '')
                        this.node.appendChild(this.skill.node);
                    },
                    get hp() {
                        return this.hpNode.children.length;
                    },
                    set hp(value) { // TODO: animation
                        this.hpNode.dataset.condition = value > 3 ? 'high' : 'mid';
                        while (this.hpNode.children.length > value) {
                            this.hpNode.removeChild(this.hpNode.lastChild);
                        }
                        while (this.hpNode.children.length < value) {
                            this.hpNode.appendChild(document.createElement('div'));
                        }
                    },
                    get types() {
                        return this._types;
                    },
                    set types(value) {
                        for (let [i,c] of Array.from(this.typesNode.children).entries()) {
                            c.classList[(1 << i) & value ? 'remove' : 'add']('invalid');
                        }
                        this._types = value;
                    },
                    get skills() {
                        return Object.keys(this.skill.skills);
                    },
                    set skills([skills, potentialSkills]) {
                        for (let [sk, skNode] in Object.entries(this.skill.skills)) {
                            if (!skills.contains(sk)) {
                                skNode.classList.add('invalid');
                                skNode.addEventListener('transitionend', () => {
                                    skNode.remove();
                                });
                                delete this.skill.skills['sk'];
                            }
                        }
                        for (let sk of skills) {
                            if (!(sk in this.skill.skills)) {
                                // TODO: use better skill button
                                // TODO: on hover &| focus, highlight respective orbs, show skill info
                                let skNode = document.createElement("span");
                                skNode.innerText = lib.translate[sk].slice(0,2);
                                this.skill.skills[sk] = skNode;
                            }
                        }  
                        // TODO: potentialSkills
                    },
                    update(report) {
                        let newHp = 5, newskL = report.skills.length;
                        if (newskL > 0) --newHp;
                        if (newskL > 3) --newHp;
                        if (newskL > 5) --newHp;
                        this.hp = newHp;
                        this.types = report.types;
                        this.skills = [report.skills, report.potentialSkills];
                    }
                },
                init() {
                    let node = document.createElement("div"); node.style.cssText = "inset: 0";
                    this.node = node;
                    let left = document.createElement("div"); node.appendChild(left);
                    left.style.cssText = "inset: 0 50% 0 0";
                    let right = document.createElement("div"); node.appendChild(right);
                    right.style.cssText = "inset: 0 0 0 50%";
                    left.appendChild(internals.panel.orbList.node);
                    this.suitDesc.init();
                    let descText = this.suitDesc.node; right.appendChild(descText);
                    let suitData = internals.data.suits[0];
                    this.suit = internals.panel.suitDisk.init(suitData, true);
                    right.appendChild(this.suit.node);
                    let suitReport = internals.report(suitData.orbs);
                    this.suitDesc.update(suitReport);
                },
                show() {
                    if (!this.node) {
                        this.init();
                    }
                    internals.panel.node.appendChild(this.node);
                }
            },
            loadText(toggle) {
                if (!this.node) return;
                if (!this._loadText) {
                    this._loadText = document.createElement("div");
                    this._loadText.innerHTML = '加载中…';
                    this._loadText.classList.add('loadtext', 'jlsgbujiang');
                    this.node.appendChild(this._loadText);
                }
                this._loadText.style.opacity = toggle ? 1 : 0;
            },
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
                evt.currentTarget.delete(); // FIXME
                // this.panel.node = null; // FIXME
                evt.stopPropagation();
                // if(resume) game.resume2();
                return false;
            });
            ui.window.appendChild(layer);
            const mainPanel = ui.create.div('.main.menubg.jlsgbujiang', layer);
            mainPanel.addEventListener('pointerup', ui.click.touchpop);
            this.panel.node = mainPanel;
            // show loading text
            this.panel.loadText(true);
            [this.config.skillRequirement] = await Promise.all([this.config.skillRequirement, this.Spine]);
            this.panel.loadText(false);
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
            this.panel.suitPage.show();
            // debug
            // for (let id in this.data.orbs) {
            //     let disc = this.panel.orbList._makeOrbDesc(id);
            //     this.panel.node.appendChild(disc.node);

            // }
            // let suitDisk = this.panel.suitDisk.init(this.data.suits[0], true);
            // this.panel.node.appendChild(suitDisk.node);
            // debug skill requirement
            // let targets = Object.keys(lib.character).randomGets(10);
            // for (let target of targets) {
            //     console.log(target, get.translation(target), get.rank(target));
            //     console.log(lib.character[target][3].map(s => [get.translation(s), this.getSkillRequirement(s)]).flat(2));
            // }
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
                    result.types |= 1 << (orbs[0][1] - 1);
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
        // TODO: caching
        getSkillRequirement(name) {
            let temp = this.config.skillRequirement[name];
            if (temp) {
                return temp;
            }
            /** TODO: refine based on drawing etc*/
            temp = [0, 0, 0, 0];
            /** owner group */
            let gp = new Set();
            let raN3 = [], raN4 = [];
            {
                let temp = this.utils.seededRand(name, 27 * 64);
                for (let _ of Array(3)) {
                    raN4.push(temp % 4);
                    temp >>= 2;
                }
                for (let _ of Array(3)) {
                    raN3.push(temp % 3);
                    temp = Math.floor(temp / 3);
                }
            }
            /** skill strength estimation */
            let strength = [];
            // TODO: use fixed character list
            for (const i in lib.character) {
                const info = lib.character[i];
                if (info[3].includes(name)) {
                    gp.add(info[1]);
                    if (info[1] == 'shen' || i.startsWith('boss')) continue;
                    let cRank = get.rank(i, true);
                    let newStr = (cRank - 1) / info[3].length;
                    if (cRank != 10) {
                        if (info[2] < 4) {
                            newStr *= 1.5 ** (4 - info[2])
                        } else {
                            newStr *= 1.25 ** (4 - info[2])
                        }
                    }
                    // strength.push(get.rank(i, true) / info[3].length)
                    strength.push(newStr)
                }
            }
            if (!gp.size) return [1, 1, 1, 1];
            if (!strength.length) {
                strength = 6;
            } else {
                strength = strength.reduce((a, b) => a + b) / strength.length;
            }
            if (strength - Math.floor(strength) > raN4[2] / 3) {
                ++strength;
            }
            strength = Math.floor(strength); strength = Math.min(strength, 8);
            if (gp.has('shu')) temp[0] = 1;
            if (gp.has('qun')) temp[1] = 1;
            if (gp.has('wu')) temp[2] = 1;
            if (gp.has('wei')) temp[3] = 1;
            if (gp.has('jin')) temp[3] = 1;
            let tempSum = temp.reduce((a, b) => a + b);
            if (tempSum > 1) {
                strength = Math.min(strength, 5);
                strength -= tempSum;
                while (strength >= tempSum) {
                    strength -= tempSum;
                    for (let i of temp.keys()) {
                        if (temp[i]) ++temp[i];
                    }
                }
                for (let i = 0; strength; ++i, --strength) {
                    ++temp[raN4[i]];
                }
            }
            else if (strength > 1) { // tempSum == 1
                let mainID = temp.indexOf(1), subIDs = raN3.slice();
                for (let i of subIDs.keys()) {
                    if (subIDs[i] >= mainID) ++subIDs[i];
                }
                if (strength == 8) {
                    temp[temp.indexOf(1)] = strength;
                }
                else if (strength >= 6) {
                    // 25% chance one split out
                    if (raN4[0] == 0) {
                        --strength;
                        ++temp[subIDs[0]];
                    }
                    temp[mainID] = strength;
                } else {
                    --strength;
                    if (raN4[0] <= 1) { // 1 / 2 all go to main
                        temp[mainID] += strength;
                    }
                    else {
                        if (strength == 4) {
                            --strength; ++temp[mainID];
                        }
                        if (raN3[0] + strength >= 5) {
                            --strength; ++temp[mainID];
                        }
                        if (strength) {
                            --strength; ++temp[raN4[1]];
                        }
                        while (strength--) {
                            ++temp[subIDs.shift()];
                        }

                    }
                }
            }
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
                        coeff1 /= (cnt1 + 1);
                    }
                    if (win2) {
                        ++cnt2;
                        coeff2 /= (cnt2 + 1);
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
                        if (lib.filter.characterDisabled(c)) continue;
                        for (let sk of lib.character[c][3]) {
                            if (lib.skill[sk] && !lib.skill[sk].zhuSkill && !lib.skill[sk].juexingji && !lib.skill[sk].unique &&
                                lib.translate[sk] && lib.translate[sk + '_info'])
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
            console.log('gain orbs', orbs);
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
                    newOrbs: [],
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
            seededRand(str, need = 27) {
                for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
                    h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
                        h = h << 13 | h >>> 19;
                // iterate once
                h = Math.imul(h ^ h >>> 16, 2246822507);
                h = Math.imul(h ^ h >>> 13, 3266489909);
                h = (h ^= h >>> 16) >>> 0;
                A = h % need;
                if (A < 0) A += need;
                return A;
            }
        }
    };
    return {
        name: '部将',
        content: function (config, pack) {
            internals.config.skillRequirement = new Promise((resolve, reject) => {
                lib.init.json(
                    assetURL + '/skillRequirement.json',
                    o => resolve(o),
                    () => reject()
                );
            });
            internals.Spine = new Promise((resolve, reject) => {
                if (window.PIXI) {
                    resolve();
                    return;
                }
                let script = document.createElement('script');
                script.src = 'https://unpkg.com/pixi.js@6/dist/browser/pixi.js'
                script.defer = true;
                document.head.appendChild(script);
                script.onerror = reject;
                script.onload = () => {
                    let inte;
                    let cnt = 0;
                    let task = () => {
                        setTimeout(() => {
                            ++cnt;
                            if (cnt >= 10) {
                                clearInterval(inte);
                                reject();
                            }
                            if (window.PIXI) {
                                clearInterval(inte);
                                let script2 = document.createElement('script');
                                script2.src = 'https://unpkg.com/pixi-spine@3/dist/pixi-spine.umd.js'
                                script2.defer = true;
                                script2.onerror = reject;
                                script2.onload = resolve;
                                document.head.appendChild(script2);
                            }
                        });
                    }
                    inte = setInterval(task, 200);
                }
            })
            // internals.PIXI = new Promise((resolve, reject) => {
            //     script2.addEventListener('load', resolve);
            //     script2.addEventListener('error', reject);
            // });
            /** PIXI plugins wont work when PIXI is a module! */
            // // https://unpkg.com/pixi.js@6/dist/browser/pixi.mjs
            // internals.PIXI = import('https://cdn.skypack.dev/pixi.js@6').then(m => {
            //     window.PIXI = m;
            //     return import('https://cdn.skypack.dev/pixi-spine').then(m => {
            //         // debugger;
            //         window.Spine = m.Spine;
            //     });
            //     // new Promise((resolve, reject) => {
            //     //     let script = document.createElement('script');
            //     //     script.src = 'https://unpkg.com/pixi-spine@3/dist/pixi-spine.umd.js'
            //     //     document.head.appendChild(script);
            //     //     script.addEventListener('load',resolve);
            //     //     script.addEventListener('error',reject);
            //     // });
            // }).catch(e => {
            //     console.warn('pixi or spine load failed', e);
            // })
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
            lib.init.css(assetURL, 'style');
        },
        config: {
            shortcut: {
                name: "快捷键",
                get intro() {
                    // TODO
                    return lib.device ? '长按选项→拓展打开部将界面' : '双击选项→拓展打开部将界面';
                },
                init: true,
            },
            quickSwap: {
                name: '快捷装卸',
                intro: '装配/合成界面，单击珠子自动装入/卸下',
                init: true,
            },
            slidingEquip: {
                name: '滑动装入',
                intro: '装配/合成界面，装入珠子后目标自动切换到下一个珠子',
                init: true,
            },
        },
        help: {
            部将概述: `
三行三列双对角线，珠子：<br>
均为同一色或彩珠，计为一该色色链<br>
若某技能加值打到10，且部将达成改技能的色链需求，视为拥有该技能<br>
限制：某些技能之间有冲突，一套最多两个彩珠。<br>
彩珠技能价值为3~9，单色珠子为1~4<br>
合成：<br>
珠子1决定生成珠子的技能1，珠子2决定生成珠子的技能2<br>
珠子3决定生成珠子的样式（颜色&花纹）<br>
`,
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