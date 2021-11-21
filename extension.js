if (!Array.prototype.flat) {
	Object.defineProperty(Array.prototype, 'flat', {
		configurable: true,
		value: function flat () {
			var depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);

			return depth ? Array.prototype.reduce.call(this, function (acc, cur) {
				if (Array.isArray(cur)) {
					acc.push.apply(acc, flat.call(cur, depth - 1));
				} else {
					acc.push(cur);
				}

				return acc;
			}, []) : Array.prototype.slice.call(this);
		},
		writable: true
	});
}
if (!('IntersectionObserver' in window)) {
    // actually the service detects the absence automatically so no need to wrap
    let script = document.createElement('script');
    script.src = 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver';
    document.head.appendChild(script);
}
const skillRequirement = {};
/** [
 *      Color: 0 purple,
 *             1 shu,
 *             2 qun,
 *             3 wu,
 *             4 wei,
 *      type:  0 | 1(STR) | 2(AGI) | 3(INT)
 * [skillName, count],
 * [skillName2, count2]?,
 * ] 
 */
game.import('extension', function (lib, game, ui, get, ai, _status) {
    /** without ending slash! */
    const assetURL = lib.assetURL + 'extension/部将';
    const internals = {
        panel: {
            node: null,
            init() {
                if (!this.node) throw "no panel node attached";
                let list = this.pagesList.init();
                this.node.appendChild(list);
                this.suitPage.show();
            },
            pagesList: {
                node: null,
                init() {
                    let node = document.createElement('div');
                    node.classList.add('jlsgbujiang', 'pageslist');
                    this.node = node;
                    let suitPageEntry = this._buildItem('装配', () => internals.panel.suitPage.show());
                    suitPageEntry.setAttribute('active', '');
                    node.appendChild(suitPageEntry);
                    node.appendChild(this._buildItem('合成', () => internals.panel.mixPage.show()));
                    return node;
                },
                _buildItem(text, callback) {
                    let item = document.createElement('div');
                    item.innerText = text;
                    item.addEventListener('click', function (e) {
                        for (let sib of e.currentTarget.parentElement.children) {
                            sib.removeAttribute('active');
                        }
                        callback();
                        e.currentTarget.setAttribute('active', '');
                    })
                    return item;
                },
            },
            _makeOrb(orbData) {
                let orb = document.createElement("div");
                orb.setAttribute('tabindex', '-1');
                orb.classList.add('orb', 'jlsgbujiang');
                let img = document.createElement("img"); orb.appendChild(img);
                if (!orbData) { // empty orb
                    orb.classList.add('empty');
                    img.src = assetURL + `/zz/bg.png`;
                    return orb;
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
                descMap: {}, // orbID -> {node, id, orb}
                node: null,
                listNode: null,
                controlBar: {
                    node: null,
                    filterButton: null,
                    init() {
                        let node = document.createElement('div');
                        this.node = node;
                        node.classList.add('jlsgbujiang', 'orb-list-bar');
                        let filterButton = document.createElement('div'); this.filterButton = filterButton;
                        filterButton.classList.add('shadowed', 'reduce_radius', 'pointerdiv', 'tdnode');
                        filterButton.innerText = '筛选';
                        filterButton.addEventListener('click', () => this.filterOpen());
                        node.appendChild(filterButton);
                        return node;
                    },
                    filterPanel: {
                        node: null,
                        value: {
                            skillName: '',
                            colors: [true, true, true, true, true],
                            types: [true, true, true, true],
                        },
                        init() {
                            if (this.node) return this.node;
                            this._initValueBackup = JSON.stringify(this.value);
                            let node = document.createElement('div'); this.node = node;
                            node.classList.add('jlsgbujiang', 'filter-panel');
                            {
                                let skillNameFilter = document.createElement('div');
                                skillNameFilter.classList.add('menubg', 'skill-name-filter');
                                let input = document.createElement('input');
                                input.id = 'skill-name-filter-0';
                                input.placeholder = ' ';
                                let label = document.createElement('label');
                                label.htmlFor = input.id;
                                label.innerText = '技能名…';
                                let clear = document.createElement('button');
                                skillNameFilter.append(input, label, clear);
                                input.addEventListener('blur', e => {
                                    if (e.relatedTarget === clear) return;
                                    if (this.value.skillName != input.value) {
                                        this.value.skillName = input.value;
                                        this.update();
                                    }
                                })
                                clear.addEventListener('click', e => {
                                    this.value.skillName = input.value = '';
                                    this.update();
                                });
                                skillNameFilter.addEventListener('click', e => {
                                    input.focus();
                                });
                                node.appendChild(skillNameFilter);
                            }
                            node.appendChild(document.createElement('br'));
                            {
                                let colorFilter = document.createElement('div');
                                colorFilter.classList.add('menubg', 'color-filter');
                                colorFilter.append('颜色：');
                                let colorNames = ['彩', '红', '黄', '绿', '蓝'];
                                for (let [i, color] of colorNames.entries()) {
                                    let label = document.createElement('label');
                                    label.classList.add('menubg');
                                    let input = document.createElement('input');
                                    input.type = 'checkbox';
                                    input.checked = true;
                                    input.addEventListener('change', e => {
                                        this.value.colors[i] = input.checked;
                                        this.update();

                                    })
                                    label.append(input, color);
                                    colorFilter.appendChild(label);
                                }
                                node.appendChild(colorFilter);
                            }
                            node.appendChild(document.createElement('br'));
                            {
                                let typeFilter = document.createElement('div');
                                typeFilter.classList.add('menubg', 'type-filter');
                                typeFilter.append('灵力：');
                                let colorNames = [
                                    '<span>无</span>',
                                    `<img src= "${assetURL}/zz/type/1_1.png"></img>`,
                                    `<img src= "${assetURL}/zz/type/1_2.png"></img>`,
                                    `<img src= "${assetURL}/zz/type/1_3.png"></img>`,
                                ];
                                for (let [i, type] of colorNames.entries()) {
                                    let label = document.createElement('label');
                                    label.classList.add('menubg');
                                    let input = document.createElement('input');
                                    input.type = 'checkbox';
                                    input.checked = true;
                                    input.addEventListener('change', e => {
                                        this.value.types[i] = input.checked;
                                        this.update();
                                    })
                                    label.append(input);
                                    label.insertAdjacentHTML('beforeend', type);
                                    typeFilter.appendChild(label);
                                }
                                node.appendChild(typeFilter);
                            }
                            // TODO: filter by skill num
                            return node;
                        },
                        update() {
                            if (this._initValueBackup == JSON.stringify(this.value)) {
                                internals.panel.orbList.controlBar.filterButton.classList.remove('bluebg');
                            } else {
                                internals.panel.orbList.controlBar.filterButton.classList.add('bluebg');
                            }
                            // FIXME: config for update filter on close
                            internals.panel.orbList.build();
                        },
                    },
                    filterOpen() {
                        // this.filterButton.classList.add('bluebg');
                        if (!this.filterOpenPrompt && true) { // FIXME: config for update filter on close
                            internals.panel.hintPanel.add('如果筛选时卡顿，可以在选项中关闭筛选即时更新');
                            this.filterOpenPrompt = true;
                        }
                        ui.click.touchpop();
                        const layer = ui.create.div('.popup-container');
                        layer.addEventListener('pointerup', evt => {
                            if (evt.path.includes(this.filterPanel.node)) {
                                return;
                            }
                            if (_status.dragged) return;
                            evt.currentTarget.delete();
                            evt.stopPropagation();
                            // if(resume) game.resume2();
                            return false;
                        });
                        ui.window.appendChild(layer);
                        layer.appendChild(this.filterPanel.init());
                    }
                },
                init(config = {}) {
                    if (this.node) {
                        return this.node;
                    }
                    this.build(config);
                    let node = document.createElement('div'); this.node = node;
                    node.classList.add('orb-list-wrapper', 'jlsgbujiang');
                    this.controlBar.init();
                    node.appendChild(this.controlBar.node);
                    node.appendChild(this.listNode);
                    return node;
                },
                build(config = {}) { // make new list (listNode)
                    this.descMap = {};
                    let node = document.createElement("div");
                    // if(lib.config.touchscreen){
                    //     lib.setScroll(node);
                    // }
                    // if(lib.config.mousewheel){
                    //     node.onmousewheel=ui.click.mousewheel;
                    // }
                    if (this.node && this.listNode && this.node.contains(this.listNode)) {
                        this.listNode.replaceWith(node);
                    }
                    this.listNode = node;
                    node.classList.add('orblist', 'jlsgbujiang');
                    internals.data.newOrbs = internals.data.newOrbs.filter(o => o in internals.data.orbs);
                    if (internals.data.newOrbs.length > 300) {
                        internals.data.newOrbs.length = 300;
                        internals.save();
                    }
                    // TODO: apply custom sort
                    let _newOrbs = new Set(internals.data.newOrbs);
                    for (let id of internals.data.newOrbs) {
                        if (!this.filterOrb(id)) continue;
                        let desc = this._makeOrbDesc(id);
                        node.prepend(desc.node);
                        this.descMap[id] = desc;
                    }
                    let toRenders = Object.keys(internals.data.orbs).filter(o => !_newOrbs.has(o));
                    let options = {
                        root: node,
                        rootMargin: '100%',
                    }
                    let renderMore = (entries, observer) => {
                        if (entries.some(e => e.isIntersecting)) {
                            observer.disconnect();
                            let desc, orbs = toRenders.splice(0, 100);
                            for (let id of orbs) {
                                if (!this.filterOrb(id)) continue;
                                desc = this._makeOrbDesc(id);
                                node.appendChild(desc.node);
                                this.descMap[id] = desc;
                            }
                            if (toRenders.length) {
                                observer.observe(node.lastElementChild);
                            } else {
                                let endLine = document.createElement('hr');
                                Object.assign(endLine.style, {
                                    width: '100%',
                                    marginBottom: '50px',
                                });
                            }
                        }

                    }
                    let observer = new IntersectionObserver(renderMore, options);
                    let tempC = document.createElement('div'); node.appendChild(tempC);
                    observer.observe(tempC);
                    return node;
                },
                filterOrb(orbID) {
                    let filterConfig = this.controlBar.filterPanel.value;
                    let orb = internals.data.orbs[orbID];
                    if (filterConfig.skillName) {
                        let names = filterConfig.skillName.split(' ').filter(s => s);
                        for (let name of names) {
                            if (orb[3]) {
                                if (orb[3][0].includes(name) || 
                                lib.translate[orb[3][0]] && lib.translate[orb[3][0]].includes(name)) {
                                    continue;
                                }
                            }
                            if (!orb[2][0].includes(name) && !(lib.translate[orb[2][0]] && lib.translate[orb[2][0]].includes(name))) {
                                return false;
                            } 
                        }
                    }
                    return filterConfig.colors[orb[0]] && filterConfig.types[orb[1]];
                },
                gainOrbs(orbs) {
                    internals.data.newOrbs.push(...orbs);
                    if (this.node) {
                        for (let id of orbs) {
                            if (internals.data.orbs[id]) {
                                if (!this.filterOrb(id)) continue;
                                let desc = this._makeOrbDesc(id);
                                this.listNode.prepend(desc.node);
                                this.descMap[id] = desc;
                            }
                        }
                    }
                    internals.save();
                },
                removeOrbs(orbs) {
                    for (let orbID of orbs) {
                        if (this.descMap[orbID]) {
                            this.descMap[orbID].node.remove();
                            delete this.descMap[orbID];
                        }
                    }
                },
                _makeOrbDesc(orbID) {
                    let data = internals.data.orbs[orbID];
                    if (!data) return;
                    let node = document.createElement("div");
                    node.classList.add('orbdesc', 'jlsgbujiang', 'menubg');
                    if (this._inUse.includes(orbID)) {
                        node.classList.add('inuse');
                    }
                    if (internals.data.newOrbs.contains(orbID)) { // add red dot
                        let redDot = document.createElement("div");
                        redDot.classList.add('reddot', 'jlsgbujiang');
                        node.appendChild(redDot);
                        node.addEventListener('mouseenter', e => { // TODO: ways to clear red dot on mobile devices
                            node.querySelector('.reddot').style.opacity = 0;
                            internals.data.newOrbs.remove(orbID);
                            internals.save();
                        }, { once: true });
                    }
                    let orb = internals.panel._makeOrb(data); node.appendChild(orb);
                    orb.addEventListener('click', e => {
                        if (game.getExtensionConfig('部将', 'quickSwap')) {
                            if (this._inUse.includes(orbID)) {
                                internals.panel.unequipOrb(orbID);
                            } else {
                                internals.panel.equipOrb(orbID);

                            }
                        } else {
                            // TODO: create action list tip
                            throw 'not implemented';
                        }
                    });
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
                    if (!game.getExtensionConfig('部将', 'alwaysLanes') && !lib.config.touchscreen) {
                        // setup lanes popup
                        let lanePopup;
                        node.addEventListener('mouseenter', e => {
                            lanePopup = document.createElement('div');
                            lanePopup.classList.add('jlsgbujiang', 'lane-popup', 'removing');
                            requestAnimationFrame(() => {
                                lanePopup.classList.remove('removing');
                            })
                            let req = internals.getSkillRequirement(data[2][0]);
                            lanePopup.appendChild(internals.panel.utils.makeColorLanes(req));
                            if (data[3]) {
                                let req = internals.getSkillRequirement(data[3][0]);
                                lanePopup.appendChild(internals.panel.utils.makeColorLanes(req));
                            }
                            node.appendChild(lanePopup);
                        });
                        node.addEventListener('mouseleave', e => {
                            if (lanePopup) {
                                lanePopup.delete(300);
                            }
                        })
                    }
                    lib.setIntro(node, uiintro => {
                        internals.panel.utils.addSkillInfo(uiintro, data[2][0], {
                            // num: data[2][1],
                            characterSample: true,
                        });
                        if (data[3]) {
                            internals.panel.utils.addSkillInfo(uiintro, data[3][0], {
                                // num: data[3][1],
                                characterSample: true,
                            });
                        }
                    });
                    if (lib.config.doubleclick_intro) { // double click embed hint
                        node.addEventListener('click', e => {
                            if (!node._doubleClicking) {
                                node._doubleClicking = true;
                                setTimeout(
                                    () => node._doubleClicking = false,
                                    500
                                );
                                return;
                            }
                            let describe = skillName => {
                                let hintNode = document.createElement('div');
                                { // skill name node
                                    let td = ui.create.div('.shadowed.reduce_radius.pointerdiv.tdnode');
                                    td.innerText = lib.translate[skillName];
                                    lib.setIntro(td, null, true);
                                    td._customintro = [lib.translate[skillName], lib.translate[skillName + '_info']];
                                    hintNode.appendChild(td);
                                }
                                { // skill summary
                                    let cnt = 0;
                                    for (let orbID in internals.data.orbs) {
                                        let orb = internals.data.orbs[orbID];
                                        if (orb[2][0] == skillName || orb[3] && orb[3][0] == skillName) {
                                            ++cnt;
                                        }
                                    }
                                    let des = document.createElement('div');
                                    des.style.position = 'relative';
                                    des.innerText = `同技能珠子共计${cnt}个`;
                                    hintNode.appendChild(des);
                                }
                                internals.panel.hintPanel.add(hintNode);
                            }
                            describe(data[2][0]);
                            if (data[3]) {
                                describe(data[3][0]);
                            }
                        });
                    }
                    return {
                        node: node,
                        id: orbID,
                        orb: orb,
                    }
                },
                _inUse: [],
                updateInUse(orbs) {
                    this._inUse.filter(o => !orbs.includes(o)).forEach(o => this.removeInUse(o));
                    orbs.filter(o => !this._inUse.includes(o)).forEach(o => this.addInUse(o));
                },
                addInUse(orb) {
                    if (this._inUse.includes(orb)) {
                        return;
                    }
                    this._inUse.push(orb);
                    let desc = this.descMap[orb];
                    if (desc) {
                        desc.node.classList.add('inuse');
                    }
                },
                removeInUse(orb) {
                    if (!this._inUse.includes(orb)) {
                        return;
                    }
                    this._inUse.remove(orb);
                    let desc = this.descMap[orb];
                    if (desc) {
                        desc.node.classList.remove('inuse');
                    }
                }
            },
            suitDisk: {
                node: null,
                orbs: null,
                build(data, interactive) {
                    node = document.createElement("div");
                    node.classList.add('suitdisk', 'jlsgbujiang');
                    if (interactive) {
                        this.node = node;
                        this.orbs = JSON.parse(JSON.stringify(data.orbs));
                        internals.panel.orbList.updateInUse(data.orbs.flat().filter(o => o));
                    }
                    let children = [[], [], []];
                    for (let i of Array(3).keys()) {
                        for (let j of Array(3).keys()) {
                            let orbID = data.orbs[i][j], orbNode;
                            if (!orbID || !internals.data.orbs[orbID]) {
                                orbNode = internals.panel._makeOrb();
                                orbNode.addEventListener('click', this._toggler());
                            } else {
                                let orbData = internals.data.orbs[orbID];
                                orbNode = internals.panel._makeOrb(orbData);
                                internals.panel.utils.makeInuseOrbInfo(orbNode, orbID);
                                if (interactive) {
                                    orbNode.addEventListener('click', this._toggler(orbID));
                                }
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
                _toggler(orbID) {
                    if (!orbID) { // focus
                        return e => {
                            if (e.currentTarget.classList.contains('focused')) {
                                return;
                            }
                            let idx = Array.from(e.currentTarget.parentNode.children).indexOf(e.currentTarget);
                            this.focus = [Math.floor(idx / 3), idx % 3];
                            internals.panel.focus(e.currentTarget);
                        }
                    };
                    return e => {
                        if (game.getExtensionConfig('部将', 'quickSwap')) { // unequip & undo 
                            let newChild = this.unequipOrb(orbID);
                            let undoCallback = () => this.equipOrb(orbID, true);
                            newChild.addEventListener('click', undoCallback, { once: true });
                            internals.panel.removeUndo = () => {
                                newChild.removeEventListener('click', undoCallback);
                            }
                        } else {
                            // TODO: create action list tip
                            throw 'not implemented';
                        }
                    };
                },
                equipOrb(orbID, isUndo) {
                    if (!this.focus) return;
                    let [i, j] = this.focus;
                    console.assert(this.node.children[i * 3 + j].classList.contains('focused'));
                    if (this.orbs[i][j]) {
                        internals.panel.orbList.removeInUse(this.orbs[i][j]);
                    }
                    this.orbs[i][j] = orbID;
                    this.update();
                    internals.panel.orbList.addInUse(orbID);
                    let newChild = internals.panel._makeOrb(internals.data.orbs[orbID]);
                    internals.panel.utils.makeInuseOrbInfo(newChild, orbID);
                    this.node.children[i * 3 + j].replaceWith(newChild);
                    newChild.addEventListener('click', this._toggler(orbID));
                    if (!isUndo && game.getExtensionConfig('部将', 'slidingEquip')) {
                        if (i == 2 && j == 2) {
                            this.focus = [0, 0];
                            internals.panel.focus(this.node.firstChild);
                        } else {
                            ++this.focus[1];
                            this.focus[0] += Math.floor(this.focus[1] / 3);
                            this.focus[1] %= 3;
                            internals.panel.focus(newChild.nextSibling);
                        }
                    } else {
                        internals.panel.focus(newChild);
                    }
                    internals.panel.suitPage.suitsDisks.dirtyChanged();
                    return newChild;
                },
                unequipOrb(orbID) {
                    let newChild = internals.panel._makeOrb(); // generate place holder
                    newChild.addEventListener('click', this._toggler());
                    for (let i of Array(3).keys()) {
                        for (let j of Array(3).keys()) {
                            if (this.orbs[i][j] == orbID) {
                                let oldChild = this.node.children[i * 3 + j];
                                this.orbs[i][j] = null; // remove orb in data
                                this.update(); // update description
                                internals.panel.orbList.removeInUse(orbID);
                                oldChild.replaceWith(newChild);
                                this.focus = [i, j];
                                internals.panel.focus(newChild);
                                internals.panel.suitPage.suitsDisks.dirtyChanged();
                                return newChild;
                            }
                        }
                    }
                },
                update() {
                    if (this.node && this.orbs) {
                        let report = internals.report(this.orbs);
                        internals.panel.suitPage.suitDesc.update(report);
                    }
                },
                get dirty() {
                    return this.suitPage.suitsDisks.dirty;
                }
            },
            suitPage: {
                node: null,
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
                        this.colorsNode = document.createElement("div");
                        this.colorsNode.style.cssText = 'transition: all 1s';
                        this.skill.node = document.createElement("div");
                        this.skill.node.classList.add('skills', 'jlsgbujiang');
                        this.node.append('体力 ');
                        this.node.appendChild(this.hpNode);
                        this.node.appendChild(document.createElement('br'));
                        this.node.append('灵力 ');
                        this.node.appendChild(this.typesNode);
                        this.node.appendChild(document.createElement('br'));
                        this.node.append('色链 ');
                        this.node.appendChild(this.colorsNode);
                        this.node.appendChild(document.createElement('br'));
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
                        for (let [i, c] of Array.from(this.typesNode.children).entries()) {
                            c.classList[(1 << i) & value ? 'remove' : 'add']('invalid');
                        }
                        this._types = value;
                    },
                    set colors(colors) {
                        let newNode = internals.panel.utils.makeColorLanes(colors);
                        newNode.style.display = 'inline-block';
                        this.colorsNode.replaceWith(newNode);
                        this.colorsNode = newNode;
                    },
                    get skills() {
                        return Object.keys(this.skill.skills);
                    },
                    set skills([skills, potentialSkills]) {
                        for (let [sk, skNode] of Object.entries(this.skill.skills)) {
                            if (!skills.contains(sk)) {
                                skNode.classList.add('invalid');
                                skNode.addEventListener('transitionend', () => {
                                    skNode.remove();
                                });
                                delete this.skill.skills[sk];
                            }
                        }
                        for (let sk of skills) {
                            if (!(sk in this.skill.skills)) {
                                let skNode = ui.create.div('.shadowed.reduce_radius.pointerdiv.tdnode');
                                this.skill.node.appendChild(skNode);
                                skNode.innerText = lib.translate[sk].slice(0, 2);
                                lib.setIntro(skNode, null, true);
                                // TODO: on hover &| focus, highlight respective orbs, show lane req & num fulfillment info
                                skNode._customintro = [lib.translate[sk], lib.translate[sk + '_info']];
                                this.skill.skills[sk] = skNode;
                            }
                        }
                        // TODO: potentialSkills
                    },
                    update(report) {
                        this.hp = report.hp;
                        this.types = report.types;
                        this.colors = report.colors;
                        this.skills = [report.skills, report.potentialSkills];
                    }
                },
                suitsDisks: {
                    node: null,
                    suitIdx: 0,
                    disk: null,
                    get dirty() {
                        return internals.panel.suitDisk.orbs &&
                            JSON.stringify(internals.panel.suitDisk.orbs) != JSON.stringify(internals.data.suits[this.suitIdx].orbs);
                    },
                    dirtyChanged() {
                        if (this.dirty) {
                            this.saveNode.style.display = '';
                        } else {
                            this.saveNode.style.display = 'none';
                        }
                    },
                    init() {
                        let node = document.createElement('div');
                        node.classList.add('jlsgbujiang', 'suitsdisks');
                        this.name = '未命名';
                        let nameMoreBox = document.createElement('div');
                        nameMoreBox.classList.add('jlsgbujiang', 'name-more-box');
                        nameMoreBox.appendChild(this._nameNode);
                        let moreNode = document.createElement('div');
                        moreNode.classList.add('suits-more');
                        moreNode.addEventListener('click', e => this.suitsMore(e));
                        nameMoreBox.appendChild(moreNode);
                        node.appendChild(nameMoreBox);
                        node.appendChild(document.createElement('hr'));
                        let suitData = internals.data.suits[this.suitIdx];
                        internals.panel.suitDisk.build(suitData, true);
                        let leftButton = document.createElement('button'); this._leftButton = leftButton;
                        leftButton.disabled = true;
                        leftButton.innerText = '上'; // '⮜'
                        leftButton.onclick = e => { --this.suitIdx; this.update(); }
                        let rightButton = document.createElement('button'); this._rightButton = rightButton;
                        rightButton.disabled = true;
                        rightButton.innerText = '下'; // '⮞'
                        rightButton.onclick = e => { ++this.suitIdx; this.update(); }
                        let saveNode = document.createElement('div'); this.saveNode = saveNode;
                        saveNode.classList.add('suit-save');
                        saveNode.innerText = '保存';
                        saveNode.onclick = () => {
                            internals.panel.hintPanel.add('新套装重启后生效');
                            this.save()
                        };
                        this.dirtyChanged();
                        let diskContainer = document.createElement('div'); // bottom container
                        diskContainer.classList.add('jlsgbujiang', 'suitsdisks-inner-box');
                        node.appendChild(diskContainer);
                        diskContainer.appendChild(leftButton);
                        this._diskNode = document.createElement('div');
                        diskContainer.appendChild(this._diskNode);
                        diskContainer.appendChild(rightButton);
                        diskContainer.appendChild(saveNode);
                        this.update();
                        this.node = node;
                        return node;
                    },
                    update() { // call when idx changes
                        this._leftButton.disabled = this.suitIdx === 0;
                        this._rightButton.disabled = this.suitIdx === internals.data.suits.length;
                        internals.panel.suitDisk.focus = null;
                        internals.panel.focus();
                        this.saveNode.style.display = 'none';
                        if (this.suitIdx == internals.data.suits.length) {
                            this.name = '点我新建套装';
                            if (this._diskNode) {
                                this._diskNode.style.display = 'none';
                                // internals.panel.orbList.updateInUse([]);
                            }
                            console.log('not Implemented');
                        } else {
                            let suitData = internals.data.suits[this.suitIdx];
                            this.name = suitData.name;
                            internals.panel.suitDisk.build(suitData, true);
                            let newNode = document.createElement('div');
                            newNode.classList.add('suit-disk-wrapper');
                            let aspectControl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                            aspectControl.setAttribute('viewBox', '0 0 385 331')
                            newNode.appendChild(aspectControl);
                            newNode.appendChild(internals.panel.suitDisk.node);
                            internals.panel.suitDisk.node.style.position = 'absolute';
                            this._diskNode.replaceWith(newNode);
                            this._diskNode = newNode;
                            let suitReport = internals.report(suitData.orbs); // update description
                            internals.panel.suitPage.suitDesc.update(suitReport);
                        }

                    },
                    save() {
                        internals.data.suits[this.suitIdx] = {
                            name: this.name,
                            orbs: JSON.parse(JSON.stringify(internals.panel.suitDisk.orbs)),
                        };
                        internals.save();
                        this.dirtyChanged();
                    },
                    suitsMore(e) { // show more dropdown
                        let moreNode = e.currentTarget;
                        if (e.target != moreNode) return;
                        ui.click.touchpop();
                        let dropNode = document.createElement('div');
                        dropNode.classList.add('menubg', 'jlsgbujiang', 'suits-more-dropdown')
                        internals.panel.node.addEventListener('pointerup', evt => {
                            if (!evt.path.includes(dropNode)) {
                                evt.stopPropagation();

                            }
                            setTimeout(() => dropNode.delete());
                            // if(resume) game.resume2();
                            return false;
                        }, {
                            capture: true,
                            once: true,
                        });
                        if (this.suitIdx != internals.data.suits.length) {
                            let shareNode = document.createElement('div');
                            shareNode.innerText = '详细';
                            dropNode.appendChild(shareNode);
                            if (internals.data.suits.length > 1) {
                                let deleteNode = document.createElement('div');
                                deleteNode.innerText = '删除';
                                deleteNode.addEventListener('pointerup', e => {
                                    internals.data.suits.splice(this.suitIdx, 1);
                                    internals.save();
                                    if (this.suitIdx >= internals.data.suits.length) {
                                        this.suitIdx = internals.data.suits.length - 1;
                                    }
                                    this.update();
                                });
                                dropNode.appendChild(deleteNode);
                            }
                            /** TODO: share */
                            moreNode.appendChild(dropNode);
                        }
                    },
                    _nameNode: null,
                    get name() {
                        return this._nameNode ? this._nameNode.value : '未命名';
                    },
                    set name(value) {
                        if (!this._nameNode) {
                            this._nameNode = document.createElement('input');
                            this._nameNode.classList.add('suit-name');
                            this._nameNode.addEventListener('blur', e => {
                                let value = e.target.value.trim();
                                if (!value) {
                                    this._nameNode.value = this.__nameMem;
                                };
                                if (value != this.__nameMem) {
                                    this.__nameMem = value;
                                    if (this.suitIdx == internals.data.suits.length) {
                                        internals.data.suits.push({
                                            name: value,
                                            orbs: [
                                                [null, null, null],
                                                [null, null, null],
                                                [null, null, null],
                                            ]
                                        });
                                        this.update();
                                    }
                                    internals.save();
                                }
                            })
                        }
                        this.__nameMem = this._nameNode.value = value;
                        // this._nameNode.innerText = value;
                    }
                },
                init() {
                    let node = document.createElement("div"); /* node.style.cssText = "inset: 0"; */
                    node.classList.add('page-content');
                    this.node = node;
                    internals.panel.orbList.init();
                    node.appendChild(internals.panel.orbList.node);
                    let right = document.createElement("div"); node.appendChild(right);
                    right.classList.add('jlsgbujiang', 'suit-detail');
                    right.appendChild(internals.panel.hintPanel.init());
                    let avatar = document.createElement('div');
                    avatar.style.overflow = 'hidden';
                    right.appendChild(avatar);
                    let avatarImage = document.createElement('img');
                    avatar.appendChild(avatarImage);
                    avatarImage.src = assetURL + '/role/1_bg.png';
                    avatarImage.style.width = '100%';
                    this.suitDesc.init();
                    right.appendChild(this.suitDesc.node);
                    this.suitsDisks.init();
                    right.appendChild(this.suitsDisks.node);
                },
                show() {
                    if (internals.panel.currentPage == 'suit') {
                        return;
                    }
                    this.init();
                    let currentPageNode = internals.panel.node.querySelector('.page-content');
                    if (currentPageNode) {
                        currentPageNode.replaceWith(this.node);
                    } else {
                        internals.panel.node.appendChild(this.node);
                    }
                }
            },
            mixPage: {
                node: null,
                init() {
                    let node = document.createElement("div");
                    node.classList.add('page-content');
                    this.node = node;
                    internals.panel.orbList.init();
                    node.appendChild(internals.panel.orbList.node);
                    let right = document.createElement("div"); node.appendChild(right);
                    right.classList.add('jlsgbujiang', 'mix-detail');
                    right.appendChild(internals.panel.hintPanel.init());
                    right.appendChild(this.mixDisk.init());
                    return node;
                },
                show() {
                    if (internals.panel.currentPage == 'mix') {
                        return;
                    }
                    this.init();
                    let currentPageNode = internals.panel.node.querySelector('.page-content');
                    if (currentPageNode) {
                        currentPageNode.replaceWith(this.node);
                    } else {
                        internals.panel.node.appendChild(this.node);
                    }
                    internals.panel.orbList.updateInUse(this.mixDisk.orbs.map(o => o.id));
                },
                mixDisk: {
                    node: null,
                    orbs: null,
                    init() {
                        // if (this.node) return this.node;
                        let node = document.createElement("div");
                        this.node = node;
                        node.classList.add('jlsgbujiang', 'mix-disk');
                        this.orbs = [];
                        let description = [
                            '技能珠',
                            '技能珠',
                            '外观珠'
                        ];
                        for (let i of Array(3).keys()) {
                            let orbWrapper = document.createElement('div');
                            orbWrapper.classList.add('mix-orb-entry');
                            let orbNode = internals.panel._makeOrb();
                            orbNode.addEventListener('click', this._toggler());
                            let desc = document.createElement('span');
                            desc.innerHTML = description[i];
                            orbWrapper.append(orbNode, desc);
                            this.orbs.push({
                                id: null,
                                node: orbNode,
                            })
                            node.appendChild(orbWrapper);
                        }
                        let mixButton = document.createElement('div'); this.mixButton = mixButton;
                        mixButton.classList.add('mix-button');
                        mixButton.innerText = '合成';
                        node.appendChild(mixButton);
                        mixButton.onclick = () => {
                            let cnt = this.orbs.filter(o => o.id).length;
                            let suffice = internals.data.cash >= (3 - cnt) * 10;
                            if (cnt && suffice) {
                                // TODO: enable imcomplete mix at the cost of cash
                                let oldOrbs = this.orbs.map(o => o.id);
                                oldOrbs.forEach(o => this.unequipOrb(o));
                                let orbID = internals.mixOrb(oldOrbs);
                                this.focus = 0;
                                internals.panel.focus(this.node.querySelector('.orb'));
                            } else {
                                internals.panel.hintPanel.add('没有足够的珠砂');
                            }
                        }
                        this.focus = null;
                        // this.update();
                        return node;
                    },
                    _toggler(orbID) {
                        if (!orbID) { // focus
                            return e => {
                                if (e.currentTarget.classList.contains('focused')) {
                                    return;
                                }
                                let idx = Array.from(this.node.children).indexOf(e.currentTarget.parentNode);
                                this.focus = idx;
                                internals.panel.focus(e.currentTarget);
                            }
                        };
                        return e => {
                            if (game.getExtensionConfig('部将', 'quickSwap')) { // unequip & undo 
                                let newChild = this.unequipOrb(orbID);
                                let undoCallback = () => this.equipOrb(orbID, true);
                                newChild.addEventListener('click', undoCallback, { once: true });
                                internals.panel.removeUndo = () => {
                                    newChild.removeEventListener('click', undoCallback);
                                }
                            } else {
                                // TODO: create action list tip
                                throw 'not implemented';
                            }
                        };
                    },
                    equipOrb(orbID, isUndo) {
                        if (![0, 1, 2].includes(this.focus)) {
                            return;
                        }
                        console.assert(this.node.children[this.focus].querySelector('.orb').classList.contains('focused'));
                        let {id, node} = this.orbs[this.focus];
                        if (id) {
                            internals.panel.orbList.removeInUse(id);
                        }
                        internals.panel.orbList.addInUse(orbID);
                        let newChild = internals.panel._makeOrb(internals.data.orbs[orbID]);
                        internals.panel.utils.makeInuseOrbInfo(newChild, orbID);
                        newChild.addEventListener('click', this._toggler(orbID));
                        node.replaceWith(newChild);
                        this.orbs[this.focus] = {
                            id: orbID,
                            node: newChild,
                        }
                        // this.update();
                        if (!isUndo && game.getExtensionConfig('部将', 'slidingEquip')) {
                            this.focus = (this.focus + 1) % 3;
                        }
                        internals.panel.focus(this.orbs[this.focus].node);
                    },
                    unequipOrb(orbID) {
                        let newChild = internals.panel._makeOrb();
                        newChild.addEventListener('click', this._toggler());
                        for (let i of Array(3).keys()) {
                            let {id, node} = this.orbs[i];
                            if (id != orbID) continue;
                            this.orbs[i] = {
                                id: null,
                                node: newChild,
                            }; // remove orb in data
                            this.update();
                            internals.panel.orbList.removeInUse(orbID);
                            node.replaceWith(newChild);
                            this.focus = i;
                            internals.panel.focus(newChild);
                            return newChild;
                        }
                        console.warn(orbID, 'not found in use');
                    },
                    update() {
                        let cnt = this.orbs.filter(o => o.id).length;
                        let suffice = (3 - cnt) * 10 >= internals.data.cash;
                    },
                    
                }
            },
            hintPanel: {
                node: null,
                init() {
                    if (this.node) return this.node;
                    let node = document.createElement('div');
                    this.node = node;
                    node.classList.add('jlsgbujiang', 'hint-panel');
                    this.add(`部将0.2.3测试`);
                    this.add(`早期版本极其不稳定！请勿传播 积极反馈`);
                    return node;
                },
                add(newHint) {
                    if (typeof newHint === 'string') {
                        let newNode = document.createElement('div');
                        newNode.innerText = newHint;
                        newHint = newNode;
                    }
                    this.node.appendChild(newHint);
                    Object.assign(newHint.style, {
                        opacity: '0',
                        transition: 'all 0.5s',
                        backgroundColor: 'rgba(20,20,40,0.1)',
                        borderRadius: '4px',
                        marginBottom: '4px',
                        padding: '2px',
                    });
                    requestAnimationFrame(() => {
                        Object.assign(newHint.style, {
                            opacity: '1',
                        });
                    });
                    newHint.scrollIntoView(false);
                },
                clear() {
                    this.node.innerHTML = '';
                },
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
            equipOrb(orbID, isUndo) {
                switch (this.currentPage) {
                    case 'suit':
                        this.suitDisk.equipOrb(orbID, isUndo);
                        break;
                    case 'mix':
                        this.mixPage.mixDisk.equipOrb(orbID, isUndo);
                        break;
                    default:
                        break;
                }
            },
            unequipOrb(orbID) {
                switch (this.currentPage) {
                    case 'suit':
                        this.suitDisk.unequipOrb(orbID);
                        break;
                    case 'mix':
                        this.mixPage.mixDisk.unequipOrb(orbID);
                        break;
                    default:
                        break;
                }
            },
            get currentPage() {
                if (!this.node) return null;
                if (this.node.contains(this.suitPage.node)) {
                    return 'suit';
                }
                if (this.node.contains(this.mixPage.node)) {
                    return 'mix';
                }
                return null;
            },
            get removeUndo() {
                return this._removeUndo
                    ? () => { let temp = this._removeUndo; delete this._removeUndo; temp(); }
                    : (() => { });
            },
            set removeUndo(value) {
                if (this._removeUndo) {
                    this._removeUndo();
                }
                this._removeUndo = value;
                return this._removeUndo;
            },
            /**
             * change focus
             * @param {Node} node 
             */
            focus(node) {
                this.__focus = node;
                this.removeUndo();
                if (this.node) {
                    this.node.querySelectorAll('.jlsgbujiang .focused').forEach(e => e.classList.remove('focused'));
                    if (node) {
                        node.classList.add('focused')
                    }
                }
            },
            utils: {
                /**
                 * make a node containing styled lane numbers
                 * @param {[number, number, number, number]} lanes 
                 */
                makeColorLanes(lanes) {
                    let node = document.createElement('div');
                    node.classList.add('jlsgbujiang', 'color-lanes');
                    for (let n of lanes) {
                        let cNode = document.createElement('span');
                        cNode.innerText = n;
                        node.appendChild(cNode);
                    }
                    return node;
                },
                addSkillInfo(dialog, skillName, args = {}) {
                    dialog.add(lib.translate[skillName] + (args.num ? `+${args.num}` : ''));
                    let req = internals.getSkillRequirement(skillName);
                    dialog.add(internals.panel.utils.makeColorLanes(req));
                    dialog.addText(lib.translate[skillName + '_info']);
                    if (args.characterSample) {
                        let showC = 'a'.repeat(100);
                        for (let cName in lib.character) {
                            if (lib.character[cName][3].includes(skillName) && cName.length < showC.length) {
                                showC = cName;
                            }
                        }
                        if (lib.character[showC]) {
                            dialog.add([[showC], 'character']);
                        }
                    }
                },
                makeInuseOrbInfo(orbNode, orbID) {
                    // build hovering info & intro for in-use orbs
                    let orbData = internals.data.orbs[orbID];
                    let popup;
                    orbNode.addEventListener('mouseenter', e => {
                        popup = document.createElement('div');
                        orbNode.appendChild(popup);
                        popup.classList.add('jlsgbujiang', 'inuseorb-hover-popup', 'removing');
                        requestAnimationFrame(() => {
                            popup.classList.remove('removing');
                        })
                        let nameNode = document.createElement('span'); popup.appendChild(nameNode);
                        nameNode.innerText = lib.translate[orbData[2][0]] + '+' + orbData[2][1];
                        let req = internals.getSkillRequirement(orbData[2][0]);
                        popup.appendChild(internals.panel.utils.makeColorLanes(req));
                        if (orbData[3]) {
                            let nameNode = document.createElement('span'); popup.appendChild(nameNode);
                            nameNode.innerText = lib.translate[orbData[3][0]] + '+' + orbData[3][1];
                            let req = internals.getSkillRequirement(orbData[3][0]);
                            popup.appendChild(internals.panel.utils.makeColorLanes(req));
                        }
                    });
                    orbNode.addEventListener('mouseleave', e => {
                        if (popup) {
                            popup.delete(300);
                        }
                    })
                    lib.setIntro(orbNode, uiintro => {
                        internals.panel.utils.addSkillInfo(uiintro, orbData[2][0], {
                            num: orbData[2][1],
                        })
                        if (orbData[3]) {
                            internals.panel.utils.addSkillInfo(uiintro, orbData[3][0], {
                                num: orbData[3][1],
                            })
                        }
                    });
                },
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
            await this.Spine;
            this.panel.loadText(false);
            this.start();
            // lib.setHover(mainPanel, () => {});
            // const idb = await import('./modules/index.js');
        },
        config: {
            mixProbability: [
                [0.88, 0.12, 0, 1, 0, 0],
                [0.3, 0.6, 0.1, 0, 1, 0],
                [0, 0.4, 0.6, 0, 0, 1],
                [1, 0, 0, 0.98, 0.02, 0],
                [0.5, 0.5, 0, 0, 0.9, 0.1],
                [0, 0.5, 0.5, 0, 0, 1],
            ],
            coeffMap: { 
                sp: 0.03,
                s: 0.08,
                ap: 0.15,
                a: 0.45,
                am: 0.6,
                bp: 0.9,
                b: 1.1,
                bm: 1.3,
                c: 1.6,
                d: 1.9,
                x: 0.40,
            },
            skillRequirement: skillRequirement,
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
            if (this.data.states.needInitialGive) {
                // await Give a random list of orbs
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
            this.panel.init();
            // debug
            // for (let id in this.data.orbs) {
            //     let disc = this.panel.orbList._makeOrbDesc(id);
            //     this.panel.node.appendChild(disc.node);

            // }
            // let suitDisk = this.panel.suitDisk.build(this.data.suits[0], true);
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
            let orbData = [[], [], []], purpleCnt = 0;
            for (let [i, v] of suit.entries()) {
                for (let [j, w] of v.entries()) {
                    orbData[i][j] = this.data.orbs[w];
                    if (orbData[i][j] && orbData[i][j][0] === 0) ++purpleCnt;
                }
            }
            // console.log(orbData);
            let result = {
                colors: [0, 0, 0, 0],
                types: 0,
                hp: 4,
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
            result.skills = [...new Set(result.skills)];
            let unfulfilledSkills = [];
            for (let sk of result.skills) {
                let req = this.getSkillRequirement(sk);
                if (req.some((rn, i) => rn > result.colors[i])) {
                    unfulfilledSkills.push(sk);
                }
            }
            result.skills.removeArray(unfulfilledSkills);
            if (result.skills.length > 0) --result.hp;
            if (result.skills.length > 2) --result.hp;
            if (result.skills.length > 4) --result.hp;
            if (result.types & 1) ++result.hp;
            // FIXME: temporary purple fix
            if (purpleCnt > 3) {
                result.skills = [];
                result.hp = 1;
            }
            else if (purpleCnt == 3) {
                if (result.hp == 1) {
                    result.skills = [];
                } else {
                    --result.hp;
                }
            }
            return result;
        },
        // TODO: caching
        /**
         * get color lane requirements of skill
         * @param {string} name 
         * @returns {[number, number, number, number]}
         */
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
                    if (info[1] == 'shen' || i.startsWith('boss')) {
                        let idx = i.indexOf('_')
                        if (idx != -1 && lib.character[i.substr(idx + 1)]) {
                            gp.add(lib.character[i.substr(idx + 1)][1]);
                        }
                        continue;
                    }
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
            if (gp.has('shen')) {
                ++strength;
            }
            if (gp.has('shu')) temp[0] = 1;
            if (gp.has('qun')) temp[1] = 1;
            if (gp.has('wu')) temp[2] = 1;
            if (gp.has('wei')) temp[3] = 1;
            if (gp.has('jin')) temp[3] = 1;
            let tempSum = temp.reduce((a, b) => a + b);
            if (!tempSum) { // only shen found
                tempSum = 4;
                temp = [1, 1, 1, 1];
                strength -= 4;
                while (strength >= 4) {
                    strength -= 4;
                    tempSum += 4;
                    temp = temp.map(i => i + 1);
                }
                if (![0, 1].includes(strength)) strength = raN3[1] % 2;
            }
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
                        if (strength >= 3) {
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
            if (!this.saveGuard) {
                this.saveGuard = true;
                setTimeout(() => {
                    localStorage.setItem('bujiangSkillRequirement', JSON.stringify(this.config.skillRequirement))
                    this.saveGuard = false;
                });

            }
            return temp;
        },
        get bonusReady() {
            /** FIXME: move to daily bonus module as sub function */
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
                else if (cnt >= 6) return 4;
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
            // TODO: enable imcomplete mix at the cost of cash
            let orbData = orbs.map(o => this.data.orbs[o]);
            if (orbData.some(o => !o)) {
                throw 'orb not found while mixing';
            }
            let newOrb = [orbData[2][0], orbData[2][1]];
            {
                let tier = this._getTier(orbData[0][0], orbData[0][2][1]);
                let dist = this.config.mixProbability[tier].slice();
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
                let dist = this.config.mixProbability[tier].slice();
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
                    // mix coeff
                    let diff = coeff1 - coeff2;
                    coeff1 -= 0.1 * diff;
                    coeff2 += 0.1 * diff;
                }
                if (me.getAllHistory('useCard').length < 5) { // penalty for fast-forward
                    coeff1 /= 4;
                    coeff2 /= 4;
                } else {
                    if (result) {
                        coeff1 *= 1.5;
                        coeff2 *= 1.5;
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
                    this._rankSkills = {};
                    for (let key of Array(10).keys()) this._rankSkills[key + 1] = [];
                    let skills = [];
                    for (let c in lib.character) {
                        if (lib.filter.characterDisabled(c)) continue;
                        let rank = get.rank(c, true);
                        for (let sk of lib.character[c][3]) {
                            if (lib.skill[sk] && !lib.skill[sk].zhuSkill && !lib.skill[sk].juexingji && // !lib.skill[sk].unique &&
                                lib.translate[sk] && lib.translate[sk + '_info']) {
                                skills.push(sk);
                                this._rankSkills[rank].push(sk);
                            }
                        }
                    }
                    this._allSkills = skills;
                }
                let skills = lib.character[me.name1][3].filter(s => this._allSkills.includes(s));
                let addOrb = (cnt, skills) => {
                    if (!skills.length) return;
                    while (cnt) {
                        --cnt;
                        // only skill, skill at 1, skill at 2
                        let skillType = this.utils.distributionGet([0.5, 0.2, 0.3]);
                        let names = [skills.randomGet() || this._allSkills.randomGet()];
                        let name2 = names[0];
                        while (name2 === names[0]) {
                            name2 = this._allSkills.randomGet();
                        }
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
                if (me.getAllHistory('useCard').length >= 5) { // extra full-random orb
                    let cnt = this.utils.distributionGet([0.4, 0.3, 0.2, 0.1]);
                    ++cnt;
                    let coeff = get.rank(me.name1, true); // 1=d, 10=sp
                    if (me.name2) {
                        coeff = (coeff + get.rank(me.name2, true)) / 2;
                    }
                    coeff = -2/3 * coeff + 23/3; // map d ~ sp to a ~ d
                    let ranks = [];
                    while (ranks.length < cnt) {
                        let rank = Math.round(this.utils.randn_bm() + coeff);
                        if (rank < 1) rank = 1;
                        if (rank > 9) rank = 9;
                        if (this._rankSkills[rank] && this._rankSkills[rank].length) {
                            ranks.push(rank);
                        }
                    }
                    for (let rank of ranks) {
                        addOrb(1, this._rankSkills[rank]);
                    }
                }
                return result;
            };
            let rewards = resolveRewards();
            let gainedIDs = this.gainOrbs(rewards);
            setTimeout(() => {
                let winDialog = document.querySelector('.dialog > .content-container');
                if (!winDialog) {
                    winDialog = ui.dialog;
                    if (winDialog) {
                        console.log(ui.dialog);
                    } else {
                        console.warn('no end game dialog found');
                        return;
                    }
                }
                console.log(winDialog);
                winDialog = winDialog.parentElement;
                winDialog.style.transform += 'translateX(-1em)';
                let node = document.createElement('div');
                node.classList.add('jlsgbujiang', 'dialog', 'withbg');
                winDialog.prepend(node);
                Object.assign(node.style, {
                    top: 0,
                    left: 'calc(100% + 5px)',
                    textAlign: 'left',
                    transition: 'all 0.5s cubic-bezier(0, 0, 0.2, 1)',
                    transform: 'scale(1)',
                    cursor: 'pointer',
                    width: 'auto',
                    height: 'auto',
                    minWidth: '0',
                    minHeight: '0',
                    bottom: 'unset',
                    // position: 'absolute'
                });
                {
                    let text = document.createElement('div'); node.appendChild(text);
                    text.innerHTML = '部将<br>收获';
                    Object.assign(text.style, {
                        fontSize: '26px',
                        fontFamily: 'STXinwei, xinwei',
                        transition: 'opacity 0.5s cubic-bezier(0, 0, 0.2, 1)',
                        position: 'relative',
                        whiteSpace: 'nowrap',
                    });
                    node.addEventListener('click', e => {
                        text.style.opacity = 0;
                        node.style.minHeight = winDialog.offsetHeight + 'px';
                        // node.style.maxHeight = winDialog.offsetHeight +'px';
                        node.style.cursor = '';
                        node.addEventListener('transitionend', e => {
                            node.style.minWidth = '280px';
                            winDialog.style.transition = 'all 0.5s cubic-bezier(0, 0, 0.2, 1) 0s';
                            winDialog.style.transform =
                                winDialog.style.transform.replace(/translateX\(-?\d+\w*\)/, 'translateX(-140px)');
                            node.addEventListener('transitionend', e2 => {
                                if (e2 === e) return;
                                if (!gainedIDs.length) {
                                    text.innerText = '很遗憾没有收获';
                                    text.style.opacity = 1;
                                } else {
                                    text.remove();
                                    node.setAttribute('orblist', '');
                                    for (let id of gainedIDs) {
                                        let disc = this.panel.orbList._makeOrbDesc(id);
                                        node.appendChild(disc.node);
                                    }
                                }
                            }, { once: true });
                        }, { once: true });
                    }, { once: true });
                }
            }, 800);
        },
        generateRandomOrb(name1, name2) {
            // color
            let newOrb = [get.rand(5)]
            // type
            newOrb.push(this.utils.distributionGet([0.4, 0.2, 0.2, 0.2]));
            let tier = this.utils.distributionGet([0.6, 0.3, 0.1]) + (newOrb[0] == 0 ? 3 : 0);
            newOrb.push([name1, this._resolveTier(tier)]);
            if (name2 && name2 != name1) {
                let tier = this.utils.distributionGet([0.6, 0.3, 0.1]) + (newOrb[0] == 0 ? 3 : 0);
                newOrb.push([name2, this._resolveTier(tier)]);
            }
            return newOrb;
        },
        removeOrbs(orbs, args = {}) {
            for (let id of orbs) {
                delete this.data.orbs[id];
            }
            this.panel.orbList.removeOrbs(orbs);
            // update suits
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
            /** TODO: repair missing skills */
            if (this.data) {
                return;
            }
            let data = localStorage.getItem('bujiangSkillRequirement')
            if (data) {
                Object.assign(this.config.skillRequirement, JSON.parse(data));
            }
            data = localStorage.getItem('bujiang')
            if (data) {
                this.data = JSON.parse(data)
            }
            if (!this.data || this.data.cheater) {
                this.data = {
                    cash: 0,
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
                    brokenOrbs: {},
                    newOrbs: [],
                    states: {
                        needInitialGive: true,
                    }
                }
                this.save();
            } else { // solve issues in data
                lib.arenaReady.push(() => { // wait until skills are loaded into lib
                    if (!this.data.suits.length) {
                        this.data.suits.push({
                            name: '默认',
                            orbs: [
                                [null, null, null],
                                [null, null, null],
                                [null, null, null],
                            ],
                        });
                    }
                    for (let orbID in this.data.orbs) {
                        let orb = this.data.orbs[orbID];
                        if (!lib.skill[orb[2][0]] || orb[3] && !lib.skill[orb[3][0]]) {
                            this.data.brokenOrbs[orbID] = orb;
                            this.removeOrbs([orbID]);
                        }
                    }
                    for (let orbID in this.data.brokenOrbs) {
                        let orb = this.data.brokenOrbs[orbID];
                        if (lib.skill[orb[2][0]] && (!orb[3] || lib.skill[orb[3][0]])) {
                            this.data.orbs[orbID] = orb;
                            delete this.data.brokenOrbs[orbID];
                        }
                    }
                    // TODO
                    // if (!this.data.version) { // update to ver.1
                    //     this.data.version = 1;
                    //     this.data.brokenOrbs = {}

                    // }
                });
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
            },
            _randomFill(num = 750) {
                let availC = Object.keys(lib.character).filter(c => !lib.filter.characterDisabled(c));
                let orbs = [];
                for (let _ of Array(num).keys()) {
                    let skills = lib.character[availC.randomGet()][3].concat(lib.character[availC.randomGet()][3]);
                    skills = skills.randomGets([1, 2].randomGet());
                    orbs.push(internals.generateRandomOrb(...skills));
                }
                internals.gainOrbs(orbs);
            },
            /**
             * standard normal distribution
             * @returns {number}
             */
            randn_bm() {
                let u = 0, v = 0;
                while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
                while(v === 0) v = Math.random();
                let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
                // num = num / 10.0 + 0.5; // Translate to 0 -> 1
                // if (num > 1 || num < 0) return randn_bm() // resample between 0 and 1
                return num
            },
        }
    };
    internals.config.skillRequirement;
    return {
        name: '部将',
        content: function (config, pack) {
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
            // {
            //     let characters = Object.keys(lib.characterPack.mode_extension_部将);
            //     if (characters.length) {
            //         lib.config.all.characters.add('jlsg_bujiang');
            //         // Object.defineProperty(lib.characterReplace, characters[0], {
            //         //     get() { return characters.slice(); } 
            //         // });
            //     }
            // }
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
                                setTimeout(function () {
                                    cNode._doubleClicking = false;
                                }, 500);
                                if (!cNode._doubleClicking) {
                                    cNode._doubleClicking = true;
                                    return;
                                }
                                // ui.click.skin(this,player.name);
                                internals.show();
                            });
                        });
                    }, { once: true });
                })
            }
            let over = game.over;
            game.over = function (result) {
                over.apply(this, arguments);
                internals.gameOver(result); // make async?
            }
            window._bujiang = {
                show() {
                    internals.show();
                }
            }
            // debug
            window.bujiangI = internals;
        },
        precontent: function (config) {
            if (!config.enable) {
                return;
            }
            internals.setupData();
            { // add character pack
                let jlsg_bujiang = {
                    connect: true,
                    character: {
                    },
                    translate: {
                        // jlsg_bujiang: '部将',
                    }
                }
                for (let suit of internals.data.suits) {
                    if (suit.name.startsWith('_')) continue;
                    let report = internals.report(suit.orbs);
                    let group = report.colors.map((x, i) => [x, i])
                        .reduce((r, a) => (a[0] > r[0] ? a : r))[1];
                    group = ['shu', 'qun', 'wu', 'wei'][group];
                    if (report.types & 2) {
                        report.skills.push('jlsg_type2');
                    }
                    if (report.types & 4) {
                        report.skills.push('jlsg_type3');
                    }
                    jlsg_bujiang.character[suit.name + '_zuoyou'] = [
                        'female',
                        group,
                        report.hp,
                        report.skills,
                        [
                            'ext:部将/role/1_bg.png',
                            'forbidai',
                        ]
                    ];
                    jlsg_bujiang.translate[suit.name + '_zuoyou'] = suit.name;
                }
                game.addCharacterPack(jlsg_bujiang, '部将');
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
            alwaysLanes: {
                name: '色链常显',
                intro: '珠子列表总是显示色链需求，目前还没实现打开',
                init: false,
            },
            quickSwap: {
                name: '快捷装卸',
                intro: '装配/合成界面，单击珠子自动装入/卸下，目前还没实现关闭',
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
                    jlsg_type2: {
                        mod: {
                            maxHandcard: function (player, num) {
                                return num + 1;
                            }
                        },
                    },
                    jlsg_type3: {
                        trigger: { global: 'gameDrawAfter', player: 'enterGame' },
                        // silent: true,
                        forced: true,
                        content: function () {
                            player.draw(2);
                        }
                    },
                    _showBujiang: {
                        trigger: { player: 'chooseButtonBegin' },
                        silent: true,
                        filter: function(event, player) {
                            return event.parent.name == 'chooseCharacter' && event.dialog;
                        },
                        content: function () {
                            // debugger;
                            let dialog = trigger.dialog;
                            if (dialog.bujiangInjected || !lib.characterPack.mode_extension_部将) {
                                event.finish();
                                return;
                            }
                            dialog.bujiangInjected = true;
                            if (!lib.characterPack.mode_extension_部将 || !Object.keys(lib.characterPack.mode_extension_部将).length) {
                                event.finish();
                                return;
                            }
                            dialog.style.transform += 'translateX(-1em)';
                            let node = document.createElement('div');
                            node.classList.add('jlsgbujiang', 'dialog', 'withbg');
                            dialog.prepend(node);
                            Object.assign(node.style, {
                                top: 0,
                                left: 'calc(100% + 5px)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                width: 'auto',
                                height: 'auto',
                                minHeight: '0',
                                bottom: 'unset',
                            });
                            {
                                let text = document.createElement('div'); node.appendChild(text);
                                text.innerHTML = '部将<br>召唤';
                                Object.assign(text.style, {
                                    fontSize: '26px',
                                    fontFamily: 'STXinwei, xinwei',
                                    position: 'relative',
                                    whiteSpace: 'nowrap',
                                });
                            }
                            node.addEventListener('click', e => {
                                // debugger;
                                // TODO: needInitialGive aware
                                let zParent = null;
                                if (Array.isArray(dialog.buttons) && dialog.buttons[0]) {
                                    zParent = dialog.buttons[0].parentElement;
                                } else {
                                    zParent = a.querySelector('.buttons');
                                }
                                if (zParent.querySelector('.zuoyou')) {
                                    return;
                                }
                                let candidates = Object.keys(lib.characterPack.mode_extension_部将);
                                let zyName = candidates.randomGet();
                                lib.characterReplace[zyName] = [zyName, ...candidates.filter(c => c != zyName)];
                                let zuoyouButton = ui.create.button(
                                    zyName, 
                                    'characterx',
                                    zParent
                                );
                                zuoyouButton.classList.add('zuoyou');
                                if (Array.isArray(dialog.buttons)) {
                                    dialog.buttons.push(zuoyouButton);
                                }
                                game.uncheck();
                                game.check();
                            });
                        },
                    },
                },
                translate: {
                    jlsg_type2: '速灵',
                    jlsg_type2_info: '你的手牌上限+1',
                    jlsg_type3: '技灵',
                    jlsg_type3_info: '游戏开始时，你额外摸两张牌。',
                },
            },
            intro: `\
极略，部将。建议安装极略自用以获得更好的体验。<br>
<a class="jlsgbujiang" onclick="if (window._bujiang) _bujiang.show()">
打开部将</a><br>
`,
            author: 'xiaoas',
            diskURL: '',
            forumURL: '',
            version: '0.2.3',
        }, files: { character: [], card: [], skill: [] }
    }
})
// run after precontent (internals.setupData)
Object.assign(skillRequirement, {
    "jianxiong": [0,0,0,2],
    "fankui": [1,0,0,1],
    "guicai": [0,0,0,2],
    "ganglie": [0,1,0,1],
    "tuxi": [0,0,1,2],
    "luoyi": [0,0,0,1],
    "tiandu": [0,0,0,2],
    "yiji": [0,0,1,2],
    "luoshen": [0,1,0,2],
    "qingguo": [0,1,0,1],
    "rende": [1,0,0,0],
    "wusheng": [1,0,0,1],
    "paoxiao": [3,0,0,0],
    "guanxing": [2,0,1,0],
    "kongcheng": [1,0,0,0],
    "longdan": [1,1,0,0],
    "mashu": [1,0,0,1],
    "tieji": [1,0,1,0],
    "jizhi": [1,0,0,1],
    "qicai": [1,0,0,0],
    "zhiheng": [1,0,2,0],
    "qixi": [0,0,1,0],
    "keji": [0,0,1,0],
    "kurou": [0,0,1,1],
    "yingzi": [0,0,2,0],
    "fanjian": [0,0,2,1],
    "guose": [0,0,2,0],
    "liuli": [0,0,1,0],
    "qianxun": [0,0,1,0],
    "lianying": [0,1,2,0],
    "xiaoji": [0,0,1,1],
    "jieyin": [1,0,1,0],
    "qingnang": [0,2,0,0],
    "jijiu": [1,1,0,0],
    "wushuang": [0,2,0,0],
    "lijian": [0,3,0,0],
    "biyue": [0,2,0,0],
})