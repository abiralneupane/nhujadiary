var app = {

    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },

    receivedEvent: function(id) {
        var self = this;

        var currentPage = "index";

        var popup = null;

        var $$ = Dom7;

        var nhujaApp = new Framework7({
            animateNavBackIcon:true
        });

        var mainView = nhujaApp.addView('.view-main');
        
        DB.init();

        Template7.registerPartial( 'songsLoop', $$('#songsLoop').html() );


        document.addEventListener("backbutton", function(){
            
            if(popup != null){
                
                nhujaApp.closeModal(popup);
                popup = null;

            }else{

               if( currentPage == "songs" || currentPage == "playlists" ){
                    mainView.router.reloadPage("index.html");
                    currentPage = "";
                }else if( currentPage == "myplaylist" || currentPage == "addplaylist" ){
                    mainView.router.reloadPage("playlists.html");
                }else{
                    nhujaApp.confirm('You sure want to exit?','Nhuja Diary', function () {
                        navigator.app.exitApp();
                    });
                } 
            }
        }, false);


        nhujaApp.onPageInit('songs', function (page) {
            let self = app;
            
            currentPage = 'songs';

            let ptrContent = $$('.pull-to-refresh-content');

            self.__fetchSongs($$);

            ptrContent.on('ptr:refresh', function (e) {
                self.__fetchSongs($$, function(){
                    nhujaApp.pullToRefreshDone(ptrContent);
                });
            });

            $$('.pull-lyrics').on('click', function(e){
                var pullBtn = $$(this);

                $$.ajax({
                    url: 'http://api.abiralneupane.com.np/wp-json/nhuja/lyrics',
                    beforeSend: function(xhr){ 
                        pullBtn.hide();
                        pullBtn.parent().append('<span class="preloader preloader-white"></span>');
                        nhujaApp.showIndicator();
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
                            nhujaApp.hideIndicator();
                            pullBtn.show();
                            DB.saveLyrics(SQLString,function(tx, songs){
                                nhujaApp.alert( 'Lyrics fetched successfully. Pull screen to refresh the lists', 'Success');
                            });
                        }
                    }
                });
            });

            /*document.addEventListener("backbutton", function(){
                mainView.router.reloadPage("index.html");
            }, false);*/
        });

        nhujaApp.onPageInit('playlists', function (page) {
            var self = app;
            currentPage = 'playlists';

            self.__fetchPlaylist($$);

            let ptrContent = $$('.pull-to-refresh-content');
            ptrContent.on('ptr:refresh', function (e) {
                self.__fetchPlaylist($$, function(){
                    nhujaApp.pullToRefreshDone(ptrContent);
                });
            });

        });

        nhujaApp.onPageInit('addplaylist', function (page) {
            var self = app;
            currentPage = 'addplaylist';

            
            DB.getSong(function(tx, songs){
                if(typeof songs.rows != "undefined"  && songs.rows.length > 0){
                    let selector = "";
                    for(let i=0; i<songs.rows.length; i++){
                        if( songs.rows[i].lang == "English" ){
                            selector = ".smart-select select optgroup.en";
                        }else if( songs.rows[i].lang == "Hindi" ){
                            selector = ".smart-select select optgroup.in";
                        }else if( songs.rows[i].lang == "Nepali" ){
                            selector = ".smart-select select optgroup.ne";
                        }
                        
                        nhujaApp.smartSelectAddOption(selector, '<option value="'+songs.rows[i].id+'">'+songs.rows[i].name+'</option>');
                    }
               }

                console.log(playlistPopupView);
            });

            $$('form.ajax-submit').on('submitted', function (e) {
                let data = e.detail.data;
                let t = $$('input[name=title]').val();
                let s = $$('select[name=songs]').val();

                DB.savePlaylists({title: t, songs: JSON.stringify(s)}, function(tx, playlists){
                    nhujaApp.alert("Playlist saved to database", "Successfully Saved", function(){
                        mainView.router.reloadPage("playlists.html");
                    });
                });
            });
        });

        
        nhujaApp.onPageInit('myplaylist', function (page) {
            let self = app;
            
            currentPage = 'myplaylist';

            let id = page.query.playlist_id;
            let playlistObj = {
                id: '',
                title: '',
                songs:{
                    en: {
                        lang: 'English',
                        songs: []
                    },
                    in: {
                        lang: "Hindi",
                        songs: []
                    },
                    ne: {
                        lang: "Nepali",
                        songs: []
                    },

                    total:0
                }
            };

            DB.getPlaylist(id, function(playlist){
                playlistObj.id = playlist.id;
                playlistObj.title = playlist.title;

                $$('#playlist-header > span').text(playlist.title);

                if( typeof playlist.songs != "undefined" && playlist.songs.length > 0 ){
                    for(let i = 0; i< playlist.songs.length; i++ ){
                        
                        if( playlist.songs[i].lang == "English" ){
                            playlistObj.songs.en.songs.push(playlist.songs[i]);
                        }else if( playlist.songs[i].lang == "Hindi" ){
                            playlistObj.songs.in.songs.push(playlist.songs[i]);
                        }else if( playlist.songs[i].lang == "Nepali" ){
                            playlistObj.songs.ne.songs.push(playlist.songs[i]);
                        }

                        playlistObj.songs.total++;
                    }
                }

                if( playlistObj.songs.en.songs.length == 0 ){
                    delete playlistObj.songs.en;
                }

                if( playlistObj.songs.in.songs.length == 0 ){
                     delete playlistObj.songs.in;
                }

                if( playlistObj.songs.ne.songs.length == 0 ){
                   delete playlistObj.songs.ne
                }

                let myPlaylistTemplate = $$('#myplaylist-template').html();
                let compiledTemplate = Template7.compile(myPlaylistTemplate);
                let html = compiledTemplate({ playlist: playlistObj });
                $$('.playlist-view').html(html);
            });

            $$(document).on('click','.delete-playlist', function () {
                nhujaApp.confirm('Are you sure?','Nhuja Diary', function () {
                    DB.deletePlaylists(id, function(response){
                        mainView.router.reloadPage("playlists.html");
                    });
                });
            });

            /*document.addEventListener("backbutton", function(){
                mainView.router.reloadPage("playlists.html");
            }, false);*/
        });

        $$(document).on('click','.open-lyrics', function () {
            let target = $$(this);

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

            popup = nhujaApp.popup(html);

            /*document.addEventListener("backbutton", function(){
                nhujaApp.closeModal(popup);
            }, false);*/
        });

    },

    __fetchPlaylist: function($$, callback){
        let playList = [];

        if( typeof callback == "undefined" ){
            var callback = function(){}
        }

        DB.getPlaylists(function(tx, playlists){
            if(typeof playlists.rows != "undefined"  && playlists.rows.length > 0){
                
                for(let i=0; i<playlists.rows.length; i++){
                    
                    let temp = {
                        id: playlists.rows[i].id,
                        title: playlists.rows[i].title,
                        song: JSON.stringify(playlists.rows[i].songs)
                    };

                    playList.push(temp);
                }
            }

            let playlistTemplate = $$('#playlist-template').html();
            let compiledTemplate = Template7.compile(playlistTemplate);
            let html = '';

            if(playList.length > 0 ){
                html = compiledTemplate({ playlist: playList });
            }else{
                html = compiledTemplate([]);
            }
            
            $$('.playlist-block').html(html);

            callback();
        });
    },

    __fetchSongs: function($$, callback){
        if( typeof callback == "undefined" ){
            var callback = function(){}
        }

        let songsObject = { songs: [] };
        let html = "";
        DB.getSong(function(tx, songs){
            if(typeof songs.rows != "undefined"  && songs.rows.length > 0){
                
                for(let i=0; i<songs.rows.length; i++){
                    songsObject.songs.push(songs.rows[i]);
                }
            }
            
            let template = $$('#songListTemplate').html();
            let compiledTemplate = Template7.compile(template);
            let html = '';
            
            if(songsObject.songs.length > 0 ){
                html = compiledTemplate(songsObject);
            }else{
                html = compiledTemplate([]);
            }

            $$('.page-content .main-content').html(html);

            callback();
        });
    }

};


app.initialize();