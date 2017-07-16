import * as firebase from 'firebase';
import {
    ADVERTISEMENT_PATH
} from './../../interface';
import { Base } from './../base/base';
import { ERROR } from '../error/error';





export class AdvertisementTool extends Base {



    constructor() {
        super();
    }



    
    get db(): firebase.database.Reference {
        return this.root.child( ADVERTISEMENT_PATH );
    }



    



}