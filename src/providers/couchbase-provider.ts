import { Injectable, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import { Platform } from 'ionic-angular';
import { Couchbase, Database } from "cordova-couchbase/core";
import 'rxjs/add/operator/map';

declare var emit: any;

@Injectable()
export class CouchbaseProvider {

    private isInstantiated: boolean;
    private database: Database;
    private listener: EventEmitter<any> = new EventEmitter();

    public constructor(public http: Http, platform: Platform) {
        if(!this.isInstantiated) {
            platform.ready().then(() => {
                (new Couchbase()).openDatabase("nraboy").then(database => {
                    this.database = database;
                    let views = {
                        items: {
                            map: function(doc) {
                                if(doc.type == "list" && doc.title) {
                                    emit(doc._id, {title: doc.title, rev: doc._rev})
                                }
                            }.toString()
                        }
                    };
                    this.database.createDesignDocument("_design/todo", views);
                    this.database.listen(change => {
                        this.listener.emit(change.detail);
                    });
                    this.database.sync("http://192.168.57.1:4984/example", true);
                    this.isInstantiated = true;
                }, error => {
                    console.error(error);
                });
            });
        }
    }

    public getDatabase() {
        return this.database;
    }

    public getChangeListener(): EventEmitter<any> {
        return this.listener;
    }

}
