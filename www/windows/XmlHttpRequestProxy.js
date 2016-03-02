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

/**
 * Global indicator for allowing / disallowing insecure requests
 */
XmlHttpRequestProxy.allowInsecure = false;

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

        if (this.isLocal) {
            this.xmlHttpRequest.abort.apply(this.xmlHttpRequest, arguments);
        } else {

        }
    },
    getAllResponseHeaders: function () {
        console.log('XmlHttpRequestProxy - getAllResponseHeaders');

        if (this.isLocal) {
            return this.xmlHttpRequest.getAllResponseHeaders.apply(this.xmlHttpRequest, arguments);
        } else {
            var headers = "";
            var iIterator = this.httpResponseMessage.headers.first();

            while (iIterator.hasCurrent) {
                var current = iIterator.current;
                headers += current.key + ": " + current.value + "\r\n";

                iIterator.moveNext();
            }

            return headers;
        }
    },
    getResponseHeader: function (header) {
        console.log('XmlHttpRequestProxy - getResponseHeader');

        if (this.isLocal) {
            return this.xmlHttpRequest.getResponseHeader.apply(this.xmlHttpRequest, arguments);
        } else {
            return this.httpResponseMessage.headers.lookup(header);
        }
    },
    open: function (bstrMethod, bstrUrl, varAsync, bstrUser, bstrPassword) {
        console.log('XmlHttpRequestProxy - open');

        // check if request is local
        if (bstrUrl.indexOf("http") !== 0) {
            this.isLocal = true;

            // create normal XMLHttpRequest for local requests
            this.xmlHttpRequest = new this.delegate();
            this.xmlHttpRequest.onload = this.bind(this, function () {
                // mirror status etc.
                this.status = this.xmlHttpRequest.status;
                this.statusText = this.xmlHttpRequest.statusText;
                this.responseText = this.xmlHttpRequest.responseText;

                if (this.onload) {
                    this.onload.apply(this, arguments);
                }
            });

            // forward various callbacks
            this.forwardCallback("onloadstart");
            this.forwardCallback("onprogress");
            this.forwardCallback("onabort");
            this.forwardCallback("onerror");
            this.forwardCallback("ontimeout");
            this.forwardCallback("onloadend");
            this.forwardCallback("onreadystatechange");

            // forward open call
            this.xmlHttpRequest.open(bstrMethod, bstrUrl, varAsync, bstrUser, bstrPassword);

        } else {
            this.isLocal = false;

            // setup filters for ignoring SSL errors
            this.httpBaseProtocolFilter = new Windows.Web.Http.Filters.HttpBaseProtocolFilter();
            this.httpBaseProtocolFilter.ignorableServerCertificateErrors.append(Windows.Security.Cryptography.Certificates.ChainValidationResult.untrusted);
            this.httpBaseProtocolFilter.ignorableServerCertificateErrors.append(Windows.Security.Cryptography.Certificates.ChainValidationResult.expired);
            this.httpBaseProtocolFilter.ignorableServerCertificateErrors.append(Windows.Security.Cryptography.Certificates.ChainValidationResult.incompleteChain);
            this.httpBaseProtocolFilter.ignorableServerCertificateErrors.append(Windows.Security.Cryptography.Certificates.ChainValidationResult.wrongUsage);
            this.httpBaseProtocolFilter.ignorableServerCertificateErrors.append(Windows.Security.Cryptography.Certificates.ChainValidationResult.invalidName);

            // create httpclient for remote requests
            if (XmlHttpRequestProxy.allowInsecure) {
                this.httpClient = new Windows.Web.Http.HttpClient(this.httpBaseProtocolFilter);
            } else {
                this.httpClient = new Windows.Web.Http.HttpClient();
            }

            // remember request parameters
            this.method = bstrMethod.toLowerCase();
            this.uri = new Windows.Foundation.Uri(window.location.href, bstrUrl);
            this.async = varAsync;
            // prepare HTTP Method & Request Message
            this.httpMethod = Windows.Web.Http.HttpMethod[this.method];
            this.httpRequestMessage = new Windows.Web.Http.HttpRequestMessage(this.httpMethod, this.uri);
        }
    },
    send: function (data) {
        console.log('XmlHttpRequestProxy - send');

        if (this.isLocal) {
            this.xmlHttpRequest.send.apply(this.xmlHttpRequest, arguments);
        } else {
            // check if we need to add some data
            if (data) {
                this.httpRequestMessage.content = new Windows.Web.Http.HttpStringContent(
                        data,
                        Windows.Storage.Streams.UnicodeEncoding.utf8,
                        this.contentType);
            }

            // update ready state
            this.readyState = this.states.OPENED;
            this.executeCallback('onreadystatechange');

            // finally send the request
            this.httpClient.sendRequestAsync(this.httpRequestMessage).done(this.bind(this, function (response) {
                this.httpResponseMessage = response;
                this.readyState = this.states.HEADERS_RECEIVED;
                this.executeCallback('onreadystatechange');
                this.status = this.httpResponseMessage.statusCode;
                this.statusText = this.httpResponseMessage.reasonPhrase;
                this.httpResponseMessage.content.readAsStringAsync().done(
                        this.bind(this, function (content) {
                            this.responseText = content;
                            this.readyState = this.states.DONE;
                            this.executeCallback('onreadystatechange');

                            this.executeCallback('onload');
                        }),
                        this.bind(this, function (error) {
                            this.executeCallback('onerror', [error]);
                        }));
            }), this.bind(this, function (error) {
                this.executeCallback('onerror', [error]);
            }));
        }
    },
    setRequestHeader: function (header, value) {
        console.log('XmlHttpRequestProxy - setRequestHeader');

        if (this.isLocal) {
            this.xmlHttpRequest.setRequestHeader.apply(this.xmlHttpRequest, arguments);
        } else {
            this.httpRequestMessage.headers.tryAppendWithoutValidation(header, value);

            // remember content-type for data encoding
            if (header === this.contentTypeHeader) {
                this.contentType = value;
            }
        }
    },
    // internal variables
    httpClient: null,
    httpMethod: null,
    httpRequestMessage: null,
    httpResponseMessage: null,
    httpBaseProtocolFilter: null,
    xmlHttpRequest: null,
    method: 'GET',
    uri: null,
    async: true,
    isLocal: false,
    contentTypeHeader: "Content-Type",
    contentType: "text/plain",
    // helper functions
    bind: function (context, func) {
        return function () {
            func.apply(context, arguments);
        };
    },
    /**
     * Fowards a given callback from the internal XMLHttpRequest to our proxy
     * @param String name
     */
    forwardCallback: function (name) {
        this.xmlHttpRequest[name] = this.bind(this, function () {
            this.executeCallback(name, arguments);
        });
    },
    /**
     * Helper function for executing a callback, runs it asynchronous
     * @param string name
     * @param array arguments
     */
    executeCallback: function (name, callback_arguments) {
        setTimeout(this.bind(this, function () {
            if (this[name]) {
                this[name].apply(this, callback_arguments);
            }
        }), 0);
    }
};

module.exports = XmlHttpRequestProxy;
window.XMLHttpRequest = XmlHttpRequestProxy;
