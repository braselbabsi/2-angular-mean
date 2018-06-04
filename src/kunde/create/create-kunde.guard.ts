/*
 * Copyright (C) 2015 - 2018 Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Injectable} from '@angular/core'
import {
    ActivatedRouteSnapshot,
    CanDeactivate,
    RouterStateSnapshot,
} from '@angular/router'

import {log} from '../../shared'

import {CreateBuchComponent} from './create-buch.component'

@Injectable()
export class CreateBuchGuard implements CanDeactivate<CreateBuchComponent> {
    constructor() {
        console.log('CreateBuchGuard.constructor()')
    }

    @log
    canDeactivate(
        createBuch: CreateBuchComponent,
        _: ActivatedRouteSnapshot,
        __: RouterStateSnapshot,
    ) {
        if (createBuch.fertig) {
            return true
        }

        createBuch.showWarning = true
        createBuch.fertig = true
        console.warn('Beim Verlassen der Seite werden Daten verloren.')
        return false
    }

    toString() {
        return 'CreateBuchGuard'
    }
}
