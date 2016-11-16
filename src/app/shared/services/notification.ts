import { Injectable } from '@angular/core';
import { Mediator } from './mediator';
import * as _ from 'lodash';

@Injectable()
export class Notification {
    private _error: string[] = [];
    private _info: string[] = [];

    constructor(private _mediator: Mediator) {
    }

    alert(message: string, title?: string, primary?: string, secondary?: string): Promise<boolean> {
        return new Promise(resolve => {
            return this._mediator.emit<IDialog>('DialogEvent', {
                title: title || 'Alert',
                message: message,
                actions: {
                    [primary || 'Ok']: action => resolve(true),
                    [secondary || 'Cancel']: action => resolve(false)
                },
            });
        });
    }

    confirm(message: string, title?: string, ...actions: string[]): Promise<string> {
        return new Promise(resolve => {
            let dialogActions = {};

            actions.forEach(action => {
                dialogActions[action] = action => resolve(action);
            });

            return this._mediator.emit<IDialog>('DialogEvent', {
                title: title || 'Alert',
                message: message,
                actions: dialogActions
            });
        });
    }

    error(message: string | string[]) {
        let errorMessage = message as string;
        if (_.isArray(message)) {
            errorMessage = message.join('\n');
        }

        this._error.push(errorMessage);
    }

    info(message: string | string[]) {
        let infoMessage = message as string;
        if (_.isArray(message)) {
            infoMessage = message.join('\n');
        }

        this._info.push(infoMessage);
    }
}