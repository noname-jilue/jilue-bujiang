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
                evt.stopPropagation();
                // if(resume) game.resume2();
                return false;
            });
            window.layer = layer;
            ui.window.appendChild(layer);
            const mainPanel = ui.create.div('.menubg.jlsgbujiang', layer);
            mainPanel.addEventListener('pointerup', ui.click.touchpop);
            // lib.setHover(mainPanel, () => {});
        }
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