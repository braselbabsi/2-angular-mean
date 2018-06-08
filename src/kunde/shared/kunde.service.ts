// tslint:disable:max-file-line-count

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

// Bereitgestellt durch HttpClientModule (s. Re-Export in SharedModule)
// HttpClientModule enthaelt nur Services, keine Komponenten
import {
    HttpClient,
    HttpErrorResponse,
    HttpHeaders,
    HttpParams,
    HttpResponse,
} from '@angular/common/http'
import {EventEmitter, Inject, Injectable} from '@angular/core'

import {ChartConfiguration, ChartDataSets} from 'chart.js'
import * as _ from 'lodash'
import * as moment from 'moment'

import {BASE_URI, log, PATH_BUECHER} from '../../shared'
// Aus SharedModule als Singleton exportiert
import {DiagrammService} from '../../shared/diagramm.service'

import {Kunde, KundeForm, KundeServer} from './kunde'

// Methoden der Klasse HttpClient
//  * get(url, options) – HTTP GET request
//  * post(url, body, options) – HTTP POST request
//  * put(url, body, options) – HTTP PUT request
//  * patch(url, body, options) – HTTP PATCH request
//  * delete(url, options) – HTTP DELETE request

// Eine Service-Klasse ist eine "normale" Klasse gemaess ES 2015, die mittels
// DI in eine Komponente injiziert werden kann, falls sie innerhalb von
// provider: [...] bei einem Modul oder einer Komponente bereitgestellt wird.
// Eine Komponente realisiert gemaess MVC-Pattern den Controller und die View.
// Die Anwendungslogik wird vom Controller an Service-Klassen delegiert.

/**
 * Die Service-Klasse zu B&uuml;cher.
 */
@Injectable()
export class KundeService {
    private baseUriBuecher: string
    private buecherEmitter = new EventEmitter<Array<Kunde>>()
    private kundeEmitter = new EventEmitter<Kunde>()
    private errorEmitter = new EventEmitter<string | number>()
    // tslint:disable-next-line:variable-name
    private _kunde!: Kunde

    private headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/plain',
    })

    /**
     * @param diagrammService injizierter DiagrammService
     * @param httpClient injizierter Service HttpClient (von Angular)
     * @return void
     */
    constructor(
        @Inject(DiagrammService)
        private readonly diagrammService: DiagrammService,
        @Inject(HttpClient) private readonly httpClient: HttpClient,
    ) {
        this.baseUriBuecher = `${BASE_URI}${PATH_BUECHER}`
        console.log(
            `KundeService.constructor(): baseUriKunde=${this.baseUriBuecher}`,
        )
    }

    /**
     * Ein Kunde-Objekt puffern.
     * @param kunde Das Kunde-Objekt, das gepuffert wird.
     * @return void
     */
    set kunde(kunde: Kunde) {
        console.log('KundeService.set kunde()', kunde)
        this._kunde = kunde
    }

    @log
    observeBuecher(next: (buecher: Array<Kunde>) => void) {
        // Observable.subscribe() aus RxJS liefert ein Subscription Objekt,
        // mit dem man den Request auch abbrechen ("cancel") kann
        // tslint:disable:max-line-length
        // https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/subscribe.md
        // http://stackoverflow.com/questions/34533197/what-is-the-difference-between-rx-observable-subscribe-and-foreach
        // https://xgrommx.github.io/rx-book/content/observable/observable_instance_methods/subscribe.html
        // tslint:enable:max-line-length
        return this.buecherEmitter.subscribe(next)
    }

    @log
    observeKunde(next: (kunde: Kunde) => void) {
        return this.kundeEmitter.subscribe(next)
    }

    @log
    observeError(next: (err: string | number) => void) {
        return this.errorEmitter.subscribe(next)
    }

    /**
     * Buecher suchen
     * @param suchkriterien Die Suchkriterien
     */
    @log
    find(suchkriterien: KundeForm) {
        const params = this.suchkriterienToHttpParams(suchkriterien)
        const uri = this.baseUriBuecher
        console.log(`KundeService.find(): uri=${uri}`)

        // Statuscode 2xx
        const nextFn: (response: Array<KundeServer>) => void = response => {
            const buecher = response.map(jsonObjekt =>
                Kunde.fromServer(jsonObjekt),
            )
            this.buecherEmitter.emit(buecher)
        }

        const errorFn: (err: HttpErrorResponse) => void = err => {
            if (err.error instanceof ProgressEvent) {
                console.error('Client-seitiger oder Netzwerkfehler', err.error)
                this.errorEmitter.emit(-1)
                return
            }

            const {status} = err
            console.log(
                `KundeService.find(): errorFn(): status=${status}, ` +
                    'Response-Body=',
                err.error,
            )
            this.errorEmitter.emit(status)
        }

        // Observable.subscribe() aus RxJS liefert ein Subscription Objekt,
        // mit dem man den Request abbrechen ("cancel") kann
        // tslint:disable:max-line-length
        // https://angular.io/guide/http
        // https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/subscribe.md
        // http://stackoverflow.com/questions/34533197/what-is-the-difference-between-rx-observable-subscribe-and-foreach
        // https://xgrommx.github.io/rx-book/content/observable/observable_instance_methods/subscribe.html
        // tslint:enable:max-line-length
        this.httpClient
            .get<Array<KundeServer>>(uri, {params})
            .subscribe(nextFn, errorFn)

        // Same-Origin-Policy verhindert Ajax-Datenabfragen an einen Server in
        // einer anderen Domain. JSONP (= JSON mit Padding) ermoeglicht die
        // Uebertragung von JSON-Daten ueber Domaingrenzen.
        // In Angular gibt es dafuer den Service Jsonp.
    }

    /**
     * Ein Kunde anhand der ID suchen
     * @param id Die ID des gesuchten Kundes
     */
    @log
    findById(id: string) {
        // Gibt es ein gepuffertes Kunde mit der gesuchten ID und Versionsnr.?
        if (
            this._kunde !== undefined &&
            this._kunde._id === id &&
            this._kunde.version !== undefined
        ) {
            console.log('KundeService.findById(): Kunde gepuffert')
            this.kundeEmitter.emit(this._kunde)
            return
        }
        if (id === undefined) {
            console.log('KundeService.findById(): Keine Id')
            return
        }

        // Ggf wegen fehlender Versionsnummer (im ETag) nachladen
        const uri = `${this.baseUriBuecher}/${id}`

        // Statuscode 2xx
        const nextFn: ((
            response: HttpResponse<KundeServer>,
        ) => void) = response => {
            const {headers, body} = response
            const etag = headers.get('ETag')
            console.debug(`KundeService.findById(): nextFn(): ETag=${etag}`)

            if (body === null || etag === null) {
                console.error('Response-Body oder ETag ist null')
                return
            }

            this._kunde = Kunde.fromServer(body, etag)
            console.debug('KundeService.findById(): nextFn():', this._kunde)
            this.kundeEmitter.emit(this._kunde)
        }

        const errorFn: (err: HttpErrorResponse) => void = err => {
            if (err.error instanceof ProgressEvent) {
                console.error(
                    'KundeService.findById(): errorFn(): Client- oder Netzwerkfehler',
                    err.error,
                )
                this.errorEmitter.emit(-1)
                return
            }

            const {status} = err
            console.log(
                `KundeService.findById(): errorFn(): status=${status}` +
                    `Response-Body=${err.error}`,
            )
            this.errorEmitter.emit(status)
        }

        console.log('KundeService.findById(): GET-Request')
        this.httpClient
            .get<KundeServer>(uri, {observe: 'response'})
            .subscribe(nextFn, errorFn)
    }

    /**
     * Ein neues Kunde anlegen
     * @param neuesKunde Das JSON-Objekt mit dem neuen Kunde
     * @param successFn Die Callback-Function fuer den Erfolgsfall
     * @param errorFn Die Callback-Function fuer den Fehlerfall
     */
    @log
    save(
        neuesKunde: Kunde,
        successFn: (location: string | undefined) => void,
        errorFn: (status: number, errors: {[s: string]: any}) => void,
    ) {
        // Alternative:date-fns
        neuesKunde.datum = moment(new Date())

        const nextFn: ((response: HttpResponse<string>) => void) = response => {
            console.debug('KundeService.save(): nextFn(): response', response)
            const {headers} = response
            const location = headers.get('Location') || undefined
            console.log('KundeService.save(): nextFn(): location', location)
            successFn(location)
        }
        // async. Error-Callback statt sync. try/catch
        const errorFnPost: ((err: HttpErrorResponse) => void) = err => {
            if (err.error instanceof Error) {
                console.error(
                    'KundeService.save(): errorFnPost(): Client- oder Netzwerkfehler',
                    err.error.message,
                )
            } else {
                if (errorFn !== undefined) {
                    // z.B. {titel: ..., verlag: ..., email: ...}
                    errorFn(err.status, err.error)
                } else {
                    console.error('errorFnPost', err)
                }
            }
        }

        this.httpClient
            .post(this.baseUriBuecher, neuesKunde, {
                headers: this.headers,
                observe: 'response',
                responseType: 'text',
            })
            .subscribe(nextFn, errorFnPost)
    }

    /**
     * Ein vorhandenes Kunde aktualisieren
     * @param kunde Das JSON-Objekt mit den aktualisierten Kundedaten
     * @param successFn Die Callback-Function fuer den Erfolgsfall
     * @param errorFn Die Callback-Function fuer den Fehlerfall
     */
    @log
    update(
        kunde: Kunde,
        successFn: () => void,
        errorFn: (
            status: number,
            errors: {[s: string]: any} | undefined,
        ) => void,
    ) {
        const {version} = kunde
        if (version === undefined) {
            console.error(`Keine Versionsnummer fuer das Kunde ${kunde._id}`)
            return
        }
        const errorFnPut: ((err: HttpErrorResponse) => void) = err => {
            if (err.error instanceof Error) {
                console.error(
                    'Client-seitiger oder Netzwerkfehler',
                    err.error.message,
                )
            } else {
                if (errorFn !== undefined) {
                    errorFn(err.status, err.error)
                } else {
                    console.error('errorFnPut', err)
                }
            }
        }

        const uri = `${this.baseUriBuecher}/${kunde._id}`
        this.headers = this.headers.append('If-Match', version.toString())
        console.log('headers=', this.headers)
        this.httpClient
            .put(uri, kunde, {headers: this.headers})
            .subscribe(successFn, errorFnPut)
    }

    /**
     * Ein Kunde l&ouml;schen
     * @param kunde Das JSON-Objekt mit dem zu loeschenden Kunde
     * @param successFn Die Callback-Function fuer den Erfolgsfall
     * @param errorFn Die Callback-Function fuer den Fehlerfall
     */
    @log
    remove(
        kunde: Kunde,
        successFn: () => void | undefined,
        errorFn: (status: number) => void,
    ) {
        const uri = `${this.baseUriBuecher}/${kunde._id}`

        const errorFnDelete: ((err: HttpErrorResponse) => void) = err => {
            if (err.error instanceof Error) {
                console.error(
                    'Client-seitiger oder Netzwerkfehler',
                    err.error.message,
                )
            } else {
                if (errorFn !== undefined) {
                    errorFn(err.status)
                } else {
                    console.error('errorFnPut', err)
                }
            }
        }

        this.httpClient.delete(uri).subscribe(successFn, errorFnDelete)
    }

    // http://www.sitepoint.com/15-best-javascript-charting-libraries
    // http://thenextweb.com/dd/2015/06/12/20-best-javascript-chart-libraries
    // http://mikemcdearmon.com/portfolio/techposts/charting-libraries-using-d3

    // D3 (= Data Driven Documents) ist das fuehrende Produkt fuer
    // Datenvisualisierung:
    //  initiale Version durch die Dissertation von Mike Bostock
    //  gesponsort von der New York Times, seinem heutigen Arbeitgeber
    //  basiert auf SVG = scalable vector graphics: Punkte, Linien, Kurven, ...
    //  ca 250.000 Downloads/Monat bei https://www.npmjs.com
    //  https://github.com/mbostock/d3 mit ueber 100 Contributors

    // Chart.js ist deutlich einfacher zu benutzen als D3
    //  basiert auf <canvas>
    //  ca 25.000 Downloads/Monat bei https://www.npmjs.com
    //  https://github.com/nnnick/Chart.js mit ueber 60 Contributors

    /**
     * Ein Balkendiagramm erzeugen und bei einem Tag <code>canvas</code>
     * einf&uuml;gen.
     * @param chartElement Das HTML-Element zum Tag <code>canvas</code>
     */
    @log
    createBarChart(chartElement: HTMLCanvasElement) {
        const uri = this.baseUriBuecher
        const nextFn: ((buecher: Array<KundeServer>) => void) = buecher => {
            const labels = buecher.map(kunde => this.setKundeId(kunde))
            console.log('KundeService.createBarChart(): labels: ', labels)
            const ratingData = buecher.map(kunde => kunde.rating) as Array<
                number
            >

            // Alternativen zu Chart.js:
            // D3:            https://d3js.org
            // Google Charts: https://google-developers.appspot.com/chart
            // Chartist.js:   http://gionkunz.github.io/chartist-js
            // n3-chart:      http://n3-charts.github.io/line-chart

            const datasets: Array<ChartDataSets> = [
                {label: 'Bewertung', data: ratingData},
            ]
            const config: ChartConfiguration = {
                type: 'bar',
                data: {labels, datasets},
            }
            this.diagrammService.createChart(chartElement, config)
        }

        this.httpClient.get<Array<KundeServer>>(uri).subscribe(nextFn)
    }

    /**
     * Ein Liniendiagramm erzeugen und bei einem Tag <code>canvas</code>
     * einf&uuml;gen.
     * @param chartElement Das HTML-Element zum Tag <code>canvas</code>
     */
    @log
    createLinearChart(chartElement: HTMLCanvasElement) {
        const uri = this.baseUriBuecher
        const nextFn: ((buecher: Array<KundeServer>) => void) = buecher => {
            const labels = buecher.map(kunde => this.setKundeId(kunde))
            console.log('KundeService.createLinearChart(): labels: ', labels)
            const ratingData = buecher.map(kunde => kunde.rating) as Array<
                number
            >

            const datasets: Array<ChartDataSets> = [
                {label: 'Bewertung', data: ratingData},
            ]

            const config: ChartConfiguration = {
                type: 'line',
                data: {labels, datasets},
            }

            this.diagrammService.createChart(chartElement, config)
        }

        this.httpClient.get<Array<KundeServer>>(uri).subscribe(nextFn)
    }

    /**
     * Ein Tortendiagramm erzeugen und bei einem Tag <code>canvas</code>
     * einf&uuml;gen.
     * @param chartElement Das HTML-Element zum Tag <code>canvas</code>
     */
    @log
    createPieChart(chartElement: HTMLCanvasElement) {
        const uri = this.baseUriBuecher
        const nextFn: ((buecher: Array<KundeServer>) => void) = buecher => {
            const labels = buecher.map(kunde => this.setKundeId(kunde))
            console.log('KundeService.createLinearChart(): labels: ', labels)
            const ratingData = buecher.map(kunde => kunde.rating) as Array<
                number
            >

            const anzahl = ratingData.length
            const backgroundColor = new Array<string>(anzahl)
            const hoverBackgroundColor = new Array<string>(anzahl)
            _.times(anzahl, i => {
                backgroundColor[i] = this.diagrammService.getBackgroundColor(i)
                hoverBackgroundColor[
                    i
                ] = this.diagrammService.getHoverBackgroundColor(i)
            })

            const data: any = {
                labels,
                datasets: [
                    {
                        data: ratingData,
                        backgroundColor,
                        hoverBackgroundColor,
                    },
                ],
            }

            const config: ChartConfiguration = {type: 'pie', data}
            this.diagrammService.createChart(chartElement, config)
        }

        this.httpClient.get<Array<KundeServer>>(uri).subscribe(nextFn)
    }

    toString() {
        return `KundeService: {kunde: ${JSON.stringify(this._kunde, null, 2)}}`
    }

    /**
     * Suchkriterien in Request-Parameter konvertieren.
     * @param suchkriterien Suchkriterien fuer den GET-Request.
     * @return Parameter fuer den GET-Request
     */
    @log
    private suchkriterienToHttpParams(suchkriterien: KundeForm): HttpParams {
        let httpParams = new HttpParams()

        if (suchkriterien.titel !== undefined && suchkriterien.titel !== '') {
            httpParams = httpParams.set('titel', suchkriterien.titel)
        }
        if (suchkriterien.art !== undefined) {
            const value = suchkriterien.art as string
            httpParams = httpParams.set('art', value)
        }
        if (suchkriterien.rating !== undefined) {
            const value = suchkriterien.rating.toString()
            httpParams = httpParams.set('rating', value)
        }
        if (
            suchkriterien.verlag !== undefined &&
            suchkriterien.verlag.length !== 0
        ) {
            const value = suchkriterien.verlag as string
            httpParams = httpParams.set('verlag', value)
        }
        if (suchkriterien.javascript === true) {
            httpParams = httpParams.set('javascript', 'true')
        }
        if (suchkriterien.typescript === true) {
            httpParams = httpParams.set('typescript', 'true')
        }
        return httpParams
    }

    private setKundeId(kunde: KundeServer) {
        const selfLink = kunde.links[1].href
        if (selfLink !== undefined) {
            const lastSlash = selfLink.lastIndexOf('/')
            kunde._id = selfLink.substring(lastSlash + 1)
        }
        if (kunde._id === undefined) {
            kunde._id = 'undefined'
        }
        return kunde._id
    }
}
