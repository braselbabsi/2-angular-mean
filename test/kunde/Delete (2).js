/*
 * Copyright (C) 2017 Juergen Zimmermann
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

import {ADMIN_PASSWORD, ADMIN_USERNAME, PAUSE} from '../shared/constants'

export default {
    '@tags': ['kunden', 'delete'],

    after() {
        this.client.end()
    },

    afterEach(done) {
        this.client.pause(PAUSE)
        done()
    },

    'Kunde mit Name "Epsilon" loeschen'() {
        // Given
        const titel = 'Epsilon'
        const {page} = this.client

        // act
        page.authPage()
            // URL des "Page Objects" aufrufen
            .navigate()
            // Kommando des "Page Objects" aufrufen
            .login(ADMIN_USERNAME, ADMIN_PASSWORD)
            .checkLogin()

        page.header().clickSuche()

        page.suchePage()
            .titel(titel)
            .submit()
            .deleteErsteZeile()

        // assert
            .titel(titel)
            .submit()
            .checkFehlermeldung()
        page.authPage().logout().checkLogout()
    },
}
