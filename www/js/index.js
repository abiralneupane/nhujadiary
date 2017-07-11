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
        self.__fetchPlaylist($$);

        let ptrContent = $$('.pull-to-refresh-content');
        ptrContent.on('ptr:refresh', function (e) {
            console.log("Refresh");
            self.__fetchPlaylist($$, function(){
                console.log("Fetched");
                nhujaApp.pullToRefreshDone(ptrContent);
            });
        });


        $$('.popup-playlist').on('popup:open', function () {
            let songSelector = $$('#song-selector').html();
            let compiledTemplate = Template7.compile(songSelector);
            let songsObject = { songs: [] };

            DB.getSong(function(tx, songs){
                if(typeof songs.rows != "undefined"  && songs.rows.length > 0){

                    for(let i=0; i<songs.rows.length; i++){
                        songsObject.songs.push(songs.rows[i]);
                    }

                    let html = compiledTemplate(songsObject);
                    $$('.lyrics-select').html(html);
                }
            });
        });

        $$('form.ajax-submit').on('submitted', function (e) {
            let data = e.detail.data;
            let t = $$('input[name=title]').val();
            let s = $$('select[name=songs]').val();

            

            DB.savePlaylists({title: t, songs: JSON.stringify(s)}, function(tx, playlists){
                nhujaApp.alert("Playlist saved to database", "Successfully Saved", function(){
                    console.log(playlists);
                    nhujaApp.closeModal('.popup-playlist');
                    nhujaApp.pullToRefreshTrigger('.pull-to-refresh-content');
                });
            });
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

        nhujaApp.onPageInit('myplaylist', function (page) {
            let self = app;
            let id = page.query.playlist_id;

            DB.getPlaylist(id, function(playlist){
                console.log(playlist);
            });
            
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