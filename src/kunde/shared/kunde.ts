// tslint:disable:max-file-line-count

/*
 * Copyright (C) 2015 - 2017 Juergen Zimmermann, Hochschule Karlsruhe
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

import * as _ from 'lodash'
import * as moment from 'moment'
import 'moment/locale/de'

moment.locale('de')

const MIN_KATEGORIE = 0
const MAX_KATEGORIE = 5

export enum Geschlecht {
    WEIBLICH = 'W',
    MAENNLICH = 'M',
}

export enum Familienstand {
    LEDIG = 'L',
    VERHEIRATET = 'VH',
    GESCHIEDEN = 'G',
    VERWITWET = 'VW',
}

export interface Adresse {
    plz: string
    ort: string
}

export interface Umsatz {
    betrag: number
    waehrung: string
}

export interface User {
    username: string
    password: string
}
/**
 * Gemeinsame Datenfelder unabh&auml;ngig, ob die Kundedaten von einem Server
 * (z.B. RESTful Web Service) oder von einem Formular kommen.
 */
export interface KundeShared {
    _id?: string
    nachname?: string
    email?: string
    kategorie?: number
    newsletter?: boolean
    geburtsdatum?: Date
    umsatz?: Umsatz
    homepage?: string
    geschlecht?: Geschlecht
    familienstand?: Familienstand
    adresse?: Adresse
    username?: string
    _links?: SelfLink
    links?: any
    user: User
    version?: number
}

interface Href {
    href: string
}

interface SelfLink {
    self: Href
}
/**
 * Daten vom und zum REST-Server:
 * <ul>
 *  <li> Arrays f&uuml;r mehrere Werte, die in einem Formular als Checkbox
 *       dargestellt werden.
 *  <li> Daten mit Zahlen als Datentyp, die in einem Formular nur als
 *       String handhabbar sind.
 * </ul>
 */

 /* ggf. katgeorie, links und _links weg
 */
export interface KundeServer extends KundeShared {
    kategorie?: number
    interessen?: Array<string>
    links?: any
    _links?: SelfLink
}

/**
 * Daten aus einem Formular:
 * <ul>
 *  <li> je 1 Control fuer jede Checkbox und
 *  <li> au&szlig;erdem Strings f&uuml;r Eingabefelder f&uuml;r Zahlen.
 * </ul>
 */
export interface KundeForm extends KundeShared {
    betrag: number
    waehrung: string
    plz: string
    ort: string
    kategorie: number
    username: string
    password: string
    S?: boolean
    L?: boolean
    R?: boolean
}

/**
 * Model als Plain-Old-JavaScript-Object (POJO) fuer die Daten *UND*
 * Functions fuer Abfragen und Aenderungen.
 */
export class Kunde {
    betrag: any
    waehrung: any
    kategorieArray: Array<boolean> = []

    // wird aufgerufen von fromServer() oder von fromForm()
    private constructor(
        // tslint:disable-next-line:variable-name
        public _id: string | undefined,
        public nachname: string | undefined,
        public email: string | undefined,
        public kategorie: number | undefined,
        public newsletter: boolean | undefined,
        public geburtsdatum: Date | undefined,
        public umsatz: Umsatz | undefined,
        public homepage: string | undefined,
        public geschlecht: Geschlecht | undefined,
        public familienstand: Familienstand | undefined,
        public interessen: Array<string> | undefined,
        public adresse: Adresse | undefined,
        public username: string | undefined,
        public links: any | undefined,
        public user: User,
        public version: number | undefined,
    ) {
        this._id = _id || undefined
        this.nachname = nachname || undefined
        this.email = email || undefined
        this.kategorie = kategorie || undefined
        if (kategorie !== undefined) {
            _.times(kategorie - MIN_KATEGORIE, () =>
                this.kategorieArray.push(true),
            )
            _.times(MAX_KATEGORIE - kategorie, () =>
                this.kategorieArray.push(false),
            )
        }
        this.newsletter = newsletter || undefined
        this.geburtsdatum = geburtsdatum || undefined
        this.umsatz = umsatz
        this.homepage = homepage || undefined
        this.geschlecht = geschlecht || undefined
        this.familienstand = familienstand || undefined
        this.interessen =
            interessen === undefined ? [] : (this.interessen = interessen)
        this.adresse = adresse || undefined
        this.username = username || undefined
        this.links = links || undefined
        this.user = user || undefined
        this.version = version || undefined
    }

    /**
     * Ein Kunde-Objekt mit JSON-Daten erzeugen, die von einem RESTful Web
     * Service kommen.
     * @param kunde JSON-Objekt mit Daten vom RESTful Web Server
     * @return Das initialisierte Kunde-Objekt
     */
    static fromServer(kundeServer: KundeServer, etag?: string) {
        let selfLink: string | undefined
        if (kundeServer.links !== undefined) {
            // innerhalb von einem JSON-Array
            selfLink = kundeServer.links[1].href
        } else if (kundeServer._links !== undefined) {
            // ein einzelnes JSON-Objekt
            selfLink = kundeServer._links.self.href
        }
        let id: string | undefined
        if (selfLink !== undefined) {
            const lastSlash = selfLink.lastIndexOf('/')
            id = selfLink.substring(lastSlash + 1)
        }

        let version: number | undefined
        if (etag !== undefined) {
            // Anfuehrungszeichen am Anfang und am Ende entfernen
            const versionStr = etag.substring(1, etag.length - 1)
            version = Number.parseInt(versionStr)
        }

        const kunde = new Kunde(
            id,
            kundeServer.nachname,
            kundeServer.email,
            kundeServer.kategorie,
            kundeServer.newsletter,
            kundeServer.geburtsdatum,
            kundeServer.umsatz,
            kundeServer.homepage,
            kundeServer.geschlecht,
            kundeServer.familienstand,
            kundeServer.interessen,
            kundeServer.adresse,
            kundeServer.username,
            kundeServer.links,
            kundeServer.user,
            version,
        )
        console.log('Kunde.fromServer(): kunde=', kunde)
        return kunde
    }

    /**
     * Ein Kunde-Objekt mit JSON-Daten erzeugen, die von einem Formular kommen.
     * @param kunde JSON-Objekt mit Daten vom Formular
     * @return Das initialisierte Kunde-Objekt
     */
    static fromForm(kundeForm: KundeForm) {
        const interessen: Array<string> = []
        if (kundeForm.S === true) {
            interessen.push('S')
        }
        if (kundeForm.L === true) {
            interessen.push('L')
        }
        if (kundeForm.R === true) {
            interessen.push('R')
        }

        const umsatz: Umsatz = {
            betrag: kundeForm.betrag,
            waehrung: kundeForm.waehrung,
        }

        const user: User = {
            username: kundeForm.username,
            password: kundeForm.password,
        }

        const adresse: Adresse = {
            plz: kundeForm.plz,
            ort: kundeForm.ort,
        }

        const kunde = new Kunde(
            kundeForm._id,
            kundeForm.nachname,
            kundeForm.email,
            kundeForm.kategorie,
            kundeForm.newsletter,
            kundeForm.geburtsdatum,
            umsatz,
            kundeForm.homepage,
            kundeForm.geschlecht,
            kundeForm.familienstand,
            interessen,
            adresse,
            kundeForm.username,
            kundeForm.links,
            user,
            kundeForm.version,
        )
        console.log('Kunde.fromForm(): kunde=', kunde)
        return kunde
    }

    /**
     * Abfrage, ob im Kundetitel der angegebene Teilstring enthalten ist. Dabei
     * wird nicht auf Gross-/Kleinschreibung geachtet.
     * @param titel Zu &uuml;berpr&uuml;fender Teilstring
     * @return true, falls der Teilstring im Kundetitel enthalten ist. Sonst
     *         false.
     */
    containsNachname(nachname: string) {
        return this.nachname === undefined
            ? false
            : this.nachname.toLowerCase().includes(nachname.toLowerCase())
    }

    /**
     * Die Bewertung ("rating") des Kundees um 1 erh&ouml;hen
     */
    rateUp() {
        if (this.kategorie !== undefined && this.kategorie < MAX_KATEGORIE) {
            this.kategorie++
        }
    }

    /**
     * Die Bewertung ("Kategorie") des Kunden um 1 erniedrigen
     */
    rateDown() {
        if (this.kategorie !== undefined && this.kategorie > MIN_KATEGORIE) {
            this.kategorie--
        }
    }

    /**
     * Abfrage, ob das Kunde dem angegebenen Verlag zugeordnet ist.
     * @param verlag der Name des Verlags
     * @return true, falls das Kunde dem Verlag zugeordnet ist. Sonst false.
     */
    hasGeschlecht(geschlecht: string) {
        return this.geschlecht === geschlecht
    }

    /**
     * Aktualisierung der Stammdaten des Kunde-Objekts.
     * @param titel Der neue Kundetitel
     * @param rating Die neue Bewertung
     * @param art Die neue Kundeart (DRUCKAUSGABE oder KINDLE)
     * @param verlag Der neue Verlag
     * @param preis Der neue Preis
     * @param rabatt Der neue Rabatt
     */
    updateStammdaten(
        nachname: string,
        familienstand: Familienstand,
        geschlecht: Geschlecht,
        geburtsdatum: Date | undefined,
        betrag: number,
        waehrung: string,
    ) {
        this.nachname = nachname
        this.familienstand = familienstand
        this.geschlecht = geschlecht
        this.geburtsdatum = geburtsdatum
        this.betrag = betrag
        this.waehrung = waehrung
    }

    /**
     * Abfrage, ob es zum Kunde auch Schlagw&ouml;rter gibt.
     * @return true, falls es mindestens ein Schlagwort gibt. Sonst false.
     */
    hasInteressen() {
        if (this.interessen === undefined) {
            return false
        }
        return this.interessen.length !== 0
    }

    /**
     * Abfrage, ob es zum Kunde das angegebene Schlagwort gibt.
     * @param schlagwort das zu &uuml;berpr&uuml;fende Schlagwort
     * @return true, falls es das Schlagwort gibt. Sonst false.
     */
    hasInteresse(interesse: string) {
        if (this.interessen === undefined) {
            return false
        }
        return this.interessen.includes(interesse)
    }

    /**
     * Aktualisierung der Schlagw&ouml;rter des Kunde-Objekts.
     * @param javascript ist das Schlagwort JAVASCRIPT gesetzt
     * @param typescript ist das Schlagwort TYPESCRIPT gesetzt
     */
    updateInteressen(SPORT: boolean, LESEN: boolean, REISEN: boolean) {
        this.resetInteressen()
        if (SPORT) {
            this.addInteresse('S')
        }
        if (LESEN) {
            this.addInteresse('L')
        }
        if (REISEN) {
            this.addInteresse('R')
        }
    }

    /**
     * Konvertierung des Kundeobjektes in ein JSON-Objekt f&uuml;r den RESTful
     * Web Service.
     * @return Das JSON-Objekt f&uuml;r den RESTful Web Service
     */
    toJSON(): KundeServer {
        return {
            _id: this._id,
            nachname: this.nachname,
            email: this.email,
            kategorie: this.kategorie,
            newsletter: this.newsletter,
            geburtsdatum: this.geburtsdatum,
            umsatz: this.umsatz,
            homepage: this.homepage,
            geschlecht: this.geschlecht,
            familienstand: this.familienstand,
            interessen: this.interessen,
            adresse: this.adresse,
            username: this.username,
            links: this.links,
            user: this.user,
        }
    }

    toString() {
        return JSON.stringify(this, null, 2)
    }

    private resetInteressen() {
        this.interessen = []
    }

    private addInteresse(interesse: string) {
        if (this.interessen === undefined) {
            this.interessen = []
        }
        this.interessen.push(interesse)
    }
}
