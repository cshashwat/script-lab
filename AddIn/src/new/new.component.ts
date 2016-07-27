import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Utilities} from '../shared/helpers';
import {SnippetManager} from '../shared/services';
import {BaseComponent} from '../shared/components/base.component';

@Component({
    selector: 'new',
    templateUrl: 'new.component.html',
    styleUrls: ['new.component.scss']
})
export class NewComponent extends BaseComponent implements OnInit, OnDestroy {
    constructor(
        private _router: Router,
        private _route: ActivatedRoute,
        private _snippetManager: SnippetManager
    ) {
        super();
    }

    link: string;
    gallery: any;
    importFlag = false;

    ngOnInit() {
        this.mockPlaylist()
            .then(data => {
                return {
                    name: data.name,
                    items: _.groupBy(data.snippets, item => item.group)
                };
            })
            .then(data => {
                var remappedArray = _.map(data.items, (value, index) => {
                    return {
                        name: index,
                        items: value
                    }
                });

                return {
                    name: data.name,
                    items: remappedArray
                };
            })
            .then(data => this.gallery = data);
    }

    import(link?: string) {
        this.link = link;
        if (Utilities.isEmpty(this.link)) this._router.navigate(['edit']);
        this._snippetManager.importFromWeb(this.link)
            .then(snippet => this._router.navigate(['edit', encodeURIComponent(snippet.meta.name)]));
    }

    mockPlaylist() {
        var playlist = {
            name: 'Microsoft',
            snippets: [
                {
                    id: 'abc',
                    name: 'Set range values',
                    group: 'Range Manipulation'
                },
                {
                    id: 'abc',
                    name: 'Set cell ranges',
                    group: 'Range Manipulation'
                },
                {
                    id: 'abc',
                    name: 'Set formulas',
                    group: 'Range Manipulation'
                },
                {
                    id: 'abc',
                    name: 'Set background',
                    group: 'Range Manipulation'
                },
                {
                    id: 'abc',
                    name: 'Set range values',
                    group: 'Tables'
                },
                {
                    id: 'abc',
                    name: 'Set range values',
                    group: 'Tables'
                },
                {
                    id: 'abc',
                    name: 'Set cell ranges',
                    group: 'Tables'
                },
                {
                    id: 'abc',
                    name: 'Set formulas',
                    group: 'Tables'
                },
                {
                    id: 'abc',
                    name: 'Set background',
                    group: 'Tables'
                }
            ]
        };

        return Promise.resolve(playlist);
    }
}