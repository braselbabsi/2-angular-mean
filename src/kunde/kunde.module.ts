/*
 * Copyright (C) 2016 - 2018 Juergen Zimmermann, Hochschule Karlsruhe
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

import {NgModule, Type} from '@angular/core'
import {Title} from '@angular/platform-browser'

import {ROUTES} from '../app/routes'
import {SharedModule} from '../shared/shared.module'

import {CreateKundeComponent} from './create/create-kunde.component'
import {CreateKundeGuard} from './create/create-kunde.guard'
import {DetailsKundeComponent} from './details/details-kunde.component'
import {DetailsSchlagwoerterComponent} from './details/details-schlagwoerter.component'
import {DetailsStammdatenComponent} from './details/details-stammdaten.component'
import {BalkendiagrammComponent} from './diagramme/balkendiagramm.component'
import {LiniendiagrammComponent} from './diagramme/liniendiagramm.component'
import {TortendiagrammComponent} from './diagramme/tortendiagramm.component'
import {KundeService} from './shared/kunde.service'
import {SucheBuecherComponent} from './suche/suche-kunden.component'
import {SuchergebnisComponent} from './suche/suchergebnis.component'
import {SuchformularComponent} from './suche/suchformular.component'
import {UpdateKundeComponent} from './update/update-kunde.component'
import {UpdateSchlagwoerterComponent} from './update/update-schlagwoerter.component'
import {UpdateStammdatenComponent} from './update/update-stammdaten.component'

const komponentenExport: Array<Type<any>> = [
    CreateKundeComponent,
    DetailsKundeComponent,
    BalkendiagrammComponent,
    LiniendiagrammComponent,
    TortendiagrammComponent,
    SucheBuecherComponent,
    UpdateKundeComponent,
]

const komponentenIntern: Array<Type<any>> = [
    DetailsSchlagwoerterComponent,
    DetailsStammdatenComponent,
    SucheBuecherComponent,
    SuchergebnisComponent,
    SuchformularComponent,
    UpdateSchlagwoerterComponent,
    UpdateStammdatenComponent,
]

// Ein Modul enthaelt logisch zusammengehoerige Funktionalitaet.
// Exportierte Komponenten koennen bei einem importierenden Modul in dessen
// Komponenten innerhalb deren Templates (= HTML-Fragmente) genutzt werden.
// KundeModule ist ein "FeatureModule", das Features fuer Buecher bereitstellt
@NgModule({
    imports: [SharedModule, SharedModule.forRoot(), ROUTES],
    declarations: [...komponentenExport, ...komponentenIntern],
    // KundeService mit eigenem DI-Context innerhalb des Moduls, d.h.
    // es kann in anderen Moduln eine eigene Instanz von KundeService geben.
    // Title als Singleton aus dem SharedModule
    providers: [KundeService, CreateKundeGuard, Title],
    exports: komponentenExport,
})
export class KundeModule {}
