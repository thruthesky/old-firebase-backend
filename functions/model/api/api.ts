import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/Observable/ErrorObservable';
import { TimeoutError } from 'rxjs/Rx';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/map';

import { ERROR } from '../error/error';


export const BACKEND_API_CONNECTION_TIMEOUT = 45000; // request time out


@Injectable()
export class ApiService {

    constructor( private http: Http ) { }

    setBackendUrl(url) {
        window['url_backend_api'] = url;
    }
    getBackendUrl() {
        if (window['url_backend_api'] !== void 0) return window['url_backend_api'];
        else return null;
    }


    /**
     *
     * Returns 'Observable' which gives an Object of 'sucess' or 'error' from PHP Backend.
     *
     * @attension If there is error on json(), then 'error' callback will be called on subscribe.
     *      만약, json() 또는 JSON.parse() 에서 에러가 발생하면, subscribe() 을 에러 콜백이 호출된다.
     */
    get( url: string, option = {} ) : Observable<Response> {

        //return this.http.get( url )
        return this.processQuery( <any>this.http.get( url ), option );

    }



    /**
     *
     *
     * Returns 'Observable' which gives an Object of 'sucess' or 'error' from PHP Backend.
     *
     */

    post( data: any, option = {} ) : Observable<Response> {

        data = this.buildQuery( data );

        let url = this.getBackendUrl() + '?' + data;
        
        if ( option['debug'] ) console.log("post: ", url); // debug in console

        let o = this.http.post( this.getBackendUrl(), data, this.requestOptions )
        return this.processQuery( o, option );
    }


    get requestOptions() : RequestOptions {
        let headers  = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
        let options  = new RequestOptions({ headers: headers });
        return options;
    }


    /**
     *
     * @param error_code
     * @param error_message
     *
     * @code
     *      this.errorResponse( 'error-code' ); // Simply put error code
     *      this.errorResponse( -1234, 'error-message' ); // Error code with message. error code must be less than 0
     * @endcode
     *
     */
    errorResponse( error_code, error_message ) {
        let e = { code: error_code, message: error_message };
        return this.getErrorString( e );
    }

    /**
     * return true if the obj is error ( or error response )
     *
     * 
     *
     * @param obj
     *      obj must be a form of "{ code: -123, message: 'error message'}"
     *      if 'code' does not exist, it is considered as an ERROR.
     *      if 'code' is less than 0, then it is an error.
     * 
     *      { code: ... } 에서 code 값이 없거나 참의 값이면 에러로 간주한다.
     *
     * 참고로 internal sever error 의 경우에는 code 값이 없으로 '참'을 리턴한다.
     * 
     * @return
     *      truthy value if the object is an error response.
     *      false if no error.
     * @code
     *      
            if ( this.file.isError(err) ) return;

     * @endcode
     * 
     */
    isError( obj ) {
        if ( obj === void 0 || obj['code'] === void 0 || !obj['code'] ) return false;
        return true;
    }
    getErrorString( error ) {
      if ( error['code'] ) return `error code: ${error['code']}, error message: ${error['message']}`;
      else return error;
    }


    private processQuery( o: Observable<Response>, option = {} ) {
        let timeout = BACKEND_API_CONNECTION_TIMEOUT;
        if ( option['timeout'] !== void 0 ) timeout = option['timeout'];
        return o
            .timeout( timeout )
            .catch( err => {
                //console.log("catch() after .timeout()");
                //console.log(err);
                if ( err instanceof TimeoutError ) {
                    return Observable.throw( this.errorResponse( ERROR.timeout, "Timeout on api query." ) );
                }
                return Observable.throw( err );
            })
            .map( (e) => {
                ///
                //console.log('response body:', e['_body']); // debug. comment out to see errors from server.
                
                if ( e['_body'] == '' ) throw this.errorResponse( ERROR.response_is_empty, 'Response from Api server is emtpy.');
                if ( (<string>e['_body']).charAt(0) != '{' ) {
                    //console.info("Maybe error");
                    //console.log(e['_body']);
                }
                let re = e.json();
                if ( this.isError( re ) ) throw re;
                else return re;
             } )
            .catch( err => {
                //console.log('Api::processQuery(): caught an error: ', err);
                if ( err instanceof SyntaxError ) {
                    //console.error(err); // debug
                    return Observable.throw( this.errorResponse( ERROR.json_parse, "Error on parsing the response from server.")  ); // JSON 에러
                }
                else if ( this.isError( err ) ) return Observable.throw( this.getErrorString( err ) ); // 프로그램 적 에러
                else if ( err['_body'] && err['_body']['total'] == 0 && err['_body']['type'] == 'error' ) {
                    return Observable.throw( this.errorResponse( ERROR.disconnected, "Failed to connect to backend sever" ) );
                }
                else return Observable.throw( this.getErrorString(err) ); // 그외의 알 수 없는 에러
            } );
    }


  /**
   * Returns the body of POST method.
   *
   * @attention This addes 'module', 'submit'. If you don't needed just user http_build_query()
   *
   * @param params must be an object.
   */
  protected buildQuery( params ) {
    // params[ 'module' ] = 'ajax'; // 'module' must be ajax.
    // params[ 'submit' ] = 1; // all submit must send 'submit'=1
    return this.http_build_query( params );
  }




  protected http_build_query (formdata, numericPrefix='', argSeparator='') {
    var urlencode = this.urlencode;
    var value
    var key
    var tmp = []
    var _httpBuildQueryHelper = function (key, val, argSeparator) {
      var k
      var tmp = []
      if (val === true) {
        val = '1'
      } else if (val === false) {
        val = '0'
      }
      if (val !== null) {
        if (typeof val === 'object') {
          for (k in val) {
            if (val[k] !== null) {
              tmp.push(_httpBuildQueryHelper(key + '[' + k + ']', val[k], argSeparator))
            }
          }
          return tmp.join(argSeparator)
        } else if (typeof val !== 'function') {
          return urlencode(key) + '=' + urlencode(val)
        } else {
          throw new Error('There was an error processing for http_build_query().')
        }
      } else {
        return ''
      }
    }

    if (!argSeparator) {
      argSeparator = '&'
    }
    for (key in formdata) {
      value = formdata[key]
      if (numericPrefix && !isNaN(key)) {
        key = String(numericPrefix) + key
      }
      var query = _httpBuildQueryHelper(key, value, argSeparator)
      if (query !== '') {
        tmp.push(query)
      }
    }

    return tmp.join(argSeparator)
  }



  protected urlencode (str) {
    str = (str + '')
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A')
      .replace(/%20/g, '+')
  }


}