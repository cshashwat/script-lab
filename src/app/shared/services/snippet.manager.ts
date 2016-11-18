import { Injectable } from '@angular/core';
import { Storage, Utilities, HostTypes } from '@microsoft/office-js-helpers';
import * as jsyaml from 'js-yaml';
import { PlaygroundError } from '../helpers';
import { Request, ResponseTypes } from './request';
import { Snippet } from './snippet';
import { Notification } from './notification';
import * as _ from 'lodash';

@Injectable()
export class SnippetManager {
    private _store: Storage<ISnippet>;
    private _context: string;

    constructor(
        private _request: Request,
        private _notification: Notification
    ) {
        this._context = HostTypes[Utilities.host];
        this._store = new Storage<ISnippet>(`${this._context}Snippets`);
    }

    async create(id?: string, suffix?: string): Promise<Snippet> {
        return new Promise<Snippet>(async (resolve, reject) => {
            let result: ISnippet;

            // if an ID is provided check the store to find it else return a default snippet.
            if (id == null) {
                result = await this._request.local<ISnippet>(`snippets/${this._context.toLowerCase()}/default.yml`, ResponseTypes.YAML);

                if (result == null) {
                    reject(new PlaygroundError('Cannot retrieve snippet template. Make sure you have an active internet connection.'));
                }

                // check if we need to generate a new name. The default one is always going to be 'New Snippet'.
                if (this._exists(result.name)) {
                    result.name = this._generateName(result.name, suffix);
                }
            }
            else {
                result = await this._find(id);
                if (result == null) {
                    reject(new PlaygroundError('Cannot retrieve snippet from localStorage. Make sure the ID is correct'));
                }
            }

            return resolve(new Snippet(result));
        });
    }

    save(snippet: ISnippet): Promise<ISnippet> {
        return new Promise((resolve, reject) => {
            this._validate(snippet);
            let result = this._store.insert(snippet.id, snippet);
            this._notification.emit<ISnippet>('StorageEvent', snippet);
            return resolve(result);
        });
    }

    delete(snippet: ISnippet): Promise<ISnippet> {
        return new Promise(resolve => {
            this._validate(snippet);
            let result = this._store.remove(snippet.id);
            this._notification.emit<ISnippet>('StorageEvent', snippet);
            return resolve(result);
        });
    }

    clear(): Promise<boolean> {
        return new Promise(resolve => {
            this._store.clear();
            this._notification.emit<ISnippet>('StorageEvent', null);
            return resolve(true);
        });
    }

    local(): ISnippet[] {
        return this._store.values();
    }

    templates(url?: string, external?: boolean): Promise<IPlaylist> {
        let snippetJsonUrl = `snippets/${this._context.toLowerCase()}/playlist.json`;
        return this._request.local<IPlaylist>(snippetJsonUrl, ResponseTypes.JSON);
    }

    run(snippet: ISnippet): Promise<boolean> {
        return new Promise(resolve => {
            let yaml = jsyaml.safeDump(snippet);
            this._post('https://addin-playground-runner.azurewebsites.net', { snippet: yaml });
            return resolve(true);
        });
    }

    private _exists(name: string) {
        return this._store.values().some(item => item.name.trim() === name.trim());
    }

    private _find(id: string): Promise<ISnippet> {
        return new Promise((resolve, reject) => {
            resolve(this._store.get(id));
        });
    }

    private _validate(snippet: ISnippet) {
        if (_.isEmpty(snippet)) {
            throw new PlaygroundError('Snippet cannot be empty');
        }

        if (_.isEmpty(snippet.name)) {
            throw new PlaygroundError('Snippet name cannot be empty');
        }
    }

    private _generateName(name: string, suffix: string = ''): string {
        let newName = _.isEmpty(name.trim()) ? 'New Snippet' : name.trim();
        let regex = new RegExp(`^${name}`);
        let options = this._store.values().filter(item => regex.test(item.name.trim()));
        let maxSuffixNumber = _.reduce(options, (max, item) => {
            let match = /\(?(\d+)?\)?$/.exec(item.name.trim());
            if (max <= ~~match[1]) {
                max = ~~match[1] + 1;
            }
            return max;
        }, 0);

        return `${newName}${(suffix ? ' - ' + suffix : '')}${(maxSuffixNumber ? ' - ' + maxSuffixNumber : '')}`;
    }

    private _post(path, params) {
        let form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', path);

        for (let key in params) {
            if (params.hasOwnProperty(key)) {
                let hiddenField = document.createElement('input');
                hiddenField.setAttribute('type', 'hidden');
                hiddenField.setAttribute('name', key);
                hiddenField.setAttribute('value', params[key]);

                form.appendChild(hiddenField);
            }
        }

        document.body.appendChild(form);
        form.submit();
    }
}
