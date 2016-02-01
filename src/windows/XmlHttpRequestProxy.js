/*
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Wolfgang Koller
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

var XmlHttpRequestProxy = function () {};

XmlHttpRequestProxy.prototype = {
    // original XMLHttpRequest implementation
    delegate: window.XMLHttpRequest,
    // states
    states: {
        UNSENT: 0,
        OPENED: 1,
        HEADERS_RECEIVED: 2,
        LOADING: 3,
        DONE: 4
    },
    readyState: 0,
    // events
    onloadstart: null,
    onprogress: null,
    onabort: null,
    onerror: null,
    onload: null,
    ontimeout: null,
    onloadend: null,
    onreadystatechange: null,
    // response
    status: 0,
    statusText: "",
    responseText: null,
    // functions
    abort: function () {
        console.log('XmlHttpRequestProxy - abort');
    },
    getAllResponseHeaders: function () {
        console.log('XmlHttpRequestProxy - getAllResponseHeaders');
    },
    getResponseHeader: function () {
        console.log('XmlHttpRequestProxy - getResponseHeader');
    },
    open: function (bstrMethod, bstrUrl, varAsync, bstrUser, bstrPassword) {
        console.log('XmlHttpRequestProxy - open');

        this.httpClient = new Windows.Web.Http.HttpClient();
        this.method = bstrMethod;
        this.uri = new Windows.Foundation.Uri(window.location.href, bstrUrl);
        this.async = varAsync;
    },
    send: function () {
        console.log('XmlHttpRequestProxy - send');

        if (this.method === 'GET') {
            var me = this;
            this.httpClient.getStringAsync(this.uri).done(function (response) {
                console.log('XmlHttpRequestProxy - send - done');
            });
        } else {

        }
    },
    setRequestHeader: function () {
        console.log('XmlHttpRequestProxy - setRequestHeader');
    },
    // internal variables
    httpClient: null,
    method: 'GET',
    uri: null,
    async: true
};

module.exports = XmlHttpRequestProxy;
window.XMLHttpRequest = XmlHttpRequestProxy;
