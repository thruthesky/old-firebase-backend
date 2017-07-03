/**
 * Firebase Backend Library
 * 
 * This clss is utility library of firebase backend. What is does;
 * 
 *      - Provides basic functions
 *      - Firebase works like getting or setting data.
 * 
 * 
 * @code How to use
 *      class XXXX {
 *          lib;
 *          constructor() {
 *              this.lib = new Library( this.root );
 *          }
 *      }
 * @endcode
 * 
 * @code How to use on existing class
 * 
 *      this.user.lib.getSecretKey().then( key => key );
 * 
 * @endcode
 * 
 */

import * as firebase from 'firebase/app';

export class Library {
    constructor(
        private root: firebase.database.Reference
    ) {
    }

}
