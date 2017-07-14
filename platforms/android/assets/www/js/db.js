/*
    song
    id, name, album, artist, base_chord, lyrics, lang

    Playlists
    id, title, song_id

*/

//http://api.abiralneupane.com.np/wp-json/nhuja/lyrics
var DB = {
	db: null,

	init: function(){
		this.db = window.openDatabase("db_nhuja", "1.0", "Nhuja Diary", 200000);
		this.setupDatabase();
	},

	setupDatabase: function(){
		var self = this;
		self.db.transaction( self.populateDB, self.errorCB, function(){
        } );
	},

	populateDB: function(tx){

        //tx.executeSql( 'DROP TABLE playlist' );
        // tx.executeSql( 'DROP TABLE songs' );
        
        tx.executeSql( 'CREATE TABLE IF NOT EXISTS playlist ( \
        	id INTEGER PRIMARY KEY AUTOINCREMENT, \
        	title TEXT NOT NULL, \
            songs TEXT, \
            date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP \
        );' );

        tx.executeSql( 'CREATE TABLE IF NOT EXISTS songs ( \
        	id INTEGER PRIMARY KEY AUTOINCREMENT, \
        	name TEXT NOT NULL, \
        	album TEXT, \
        	artist TEXT, \
        	base_chord TEXT, \
        	lyrics TEXT, \
        	lang TEXT, \
            date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP \
        );' );
    },

    getPlaylists: function(cb){
    	var self = this;
    	self.db.transaction( function(tx){
    		tx.executeSql( 'SELECT * FROM playlist', [], cb, self.errorCB );
    	}, self.errorCB, function(tx){});
    },

    getPlaylist: function(id, cb){
        var self = this;
        let playlistObj = {
            id: 0,
            title: '',
            songs: []
        };
        self.db.transaction( function(tx){
            tx.executeSql( 'SELECT * FROM playlist WHERE id='+id, [], function(tx, playlist){
                let row = playlist.rows[0];
                playlistObj.id = row.id;
                playlistObj.title = row.title;

                let songs = JSON.parse(row.songs);

                if(songs.length > 0 ){
                    let songQueryPart = '';
                    for(var i=0; i<songs.length; i++){
                        songQueryPart += 'id = '+songs[i];
                        if( i < songs.length - 1 ){
                            songQueryPart += ' OR ';
                        }
                    }
                    
                    tx.executeSql( 'SELECT * FROM songs WHERE '+songQueryPart, [], function(tx, songs){
                        playlistObj.songs = songs.rows;

                        cb(playlistObj);

                    }, self.errorCB );

                }else{
                    cb(playlistObj);
                }
            }, self.errorCB );
        }, self.errorCB, function(tx){});
    },

    savePlaylists: function(playlistData, cb){
        var self = this;
        
        self.db.transaction( function(tx){
            let query = "INSERT INTO playlist(title, songs) VALUES ( '"+playlistData.title+"', '"+playlistData.songs+"')";
            tx.executeSql(query, [], cb, self.errorCB );
        }, self.errorCB, function(tx){});
    },

    deletePlaylists: function(id, cb){
        var self = this;
        self.db.transaction( function(tx){
            tx.executeSql( 'DELETE FROM playlist WHERE id='+id, [], cb, self.errorCB );
        }, self.errorCB, function(tx){});
    },

    updatePlaylists: function(){
    },

    getSong: function(cb){
        var self = this;
        
        self.db.transaction( function(tx){
            tx.executeSql( 'SELECT * FROM songs', [], cb, self.errorCB );
        }, self.errorCB, function(tx){});

    },

    saveLyrics : function(lyricsData, cb){
        var self = this;
        
        self.db.transaction( function(tx){
            tx.executeSql( 'DELETE FROM songs' );
            let query = "INSERT INTO songs(name, album, artist, base_chord, lyrics, lang ) VALUES "+lyricsData;
            tx.executeSql(query, [], cb, self.errorCB );
        }, self.errorCB, function(tx){});
        
    },

    errorCB: function(err) {
        console.error("Error processing SQL: ", err);
    }
};