/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {

    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var self = this;

        var nhujaApp = new Framework7();
        
        var $$ = Dom7;

        var mainView = nhujaApp.addView('.view-main', {
            dynamicNavbar: true
        });

        DB.init();

        console.log("This is index page");
        
        /*DB.getPlaylists(function(tx, playlists){
            console.log("This is index page inside db");
        });*/

        $$('form.ajax-submit').on('submitted', function (e) {
            var data = e.detail.data;
            var title = $$('input[name=title]').val();
            var songs = $$('select[name=songs]').val();
            var songList = songs.split(",");

        });

        nhujaApp.onPageInit('songs', function (page) {            
            let self = app;

            let ptrContent = $$('.pull-to-refresh-content');

            self.__fetchSongs($$);

            ptrContent.on('ptr:refresh', function (e) {
                self.__fetchSongs($$, function(){
                    nhujaApp.pullToRefreshDone(ptrContent);
                });
            });

            $$(document).on('click','.open-lyrics', function () {
                let target = $$(this).parent();
                let album = target.find('[name=album]').val().replace(/\\/g, '');
                let lang = target.find('[name=lang]').val().replace(/\\/g, '');

                if(!album){
                    album = "N/A";
                }

                if( lang == "English" ){
                    lang = "EN";
                }else if( lang == "Hindi" ){
                    lang = "IN";
                }else if( lang == "Nepali" ){
                    lang = "NE";
                }else{
                    lang = "";
                }

                let context = {
                    name: target.find('[name=name]').val().replace(/\\/g, ''),
                    artist: target.find('[name=artist]').val().replace(/\\/g, ''),
                    album: album,
                    scale: target.find('[name=scale]').val(),
                    lang: lang,
                    lyrics: target.find('[name=lyrics]').val().replace(/\\/g, '')
                }
                let popupHTML = $$('#popup-lyrics').html();
                let compiledTemplate = Template7.compile(popupHTML);
                let html = compiledTemplate(context);

                nhujaApp.popup(html);
            });

            $$('.pull-lyrics').on('click', function(e){
                var pullBtn = $$(this);

                $$.ajax({
                    url: 'http://api.abiralneupane.com.np/wp-json/nhuja/lyrics',
                    beforeSend: function(xhr){ 
                        pullBtn.hide();
                        pullBtn.parent().append('<span class="preloader preloader-white"></span>');
                        nhujaApp.showPreloader();
                    },
                    statusCode: {
                        200: function (xhr) {
                            var lyrics = JSON.parse(xhr.response).data;
                            var SQLString = "";

                            for( let i=0; i<lyrics.length; i++ ){
                                SQLString += '( "'+lyrics[i].name+'", "'+lyrics[i].album+'", "'+lyrics[i].artist+'", "'+lyrics[i].base_chord+'", "'+lyrics[i].lyrics+'", "'+lyrics[i].lang+'" )';
                                
                                if( lyrics.length > 1 && i != lyrics.length-1 ){
                                    SQLString += ', ';
                                }
                            }
                            pullBtn.parent().find('.preloader').remove();
                            nhujaApp.hidePreloader();
                            pullBtn.show();
                            DB.saveLyrics(SQLString,function(tx, songs){
                                nhujaApp.alert( 'Lyrics fetched successfully. Pull screen to refresh the lists', 'Success');
                            });
                        }
                    }
                });
            });

        });
    },

    __fetchSongs: function($$, callback){
        if( typeof callback == "undefined" ){
            var callback = function(){}
        }

        let songsObject = { songs: [] };

        DB.getSong(function(tx, songs){
            if(typeof songs.rows != "undefined"  && songs.rows.length > 0){
                
                let html = "";
                
                for(let i=0; i<songs.rows.length; i++){
                    songsObject.songs.push(songs.rows[i]);
                }

                var compiledTemplate = Template7.compile($$('#songListTemplate').html());
                html = compiledTemplate(songsObject);

                $$('.page-content .main-content').html(html);
            }else{
                $$('.content-block.notice > span').text('No songs found in database');
                $$('.content-block.notice').removeClass('hidden');
            }

            callback();
        });
    }


};


app.initialize();