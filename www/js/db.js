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
			console.log("Database installed");
        } );
	},

	populateDB: function(tx){

        /*tx.executeSql( 'DROP TABLE playlist' );
        tx.executeSql( 'DROP TABLE songs' );*/
        
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
    		tx.executeSql( 'SELECT * FROM playlist_song', [], cb, self.errorCB );
    	}, self.errorCB, function(tx){});

    	/*self.db.transaction( function(tx){
    		tx.executeSql('SELECT * FROM playlist_song',[],function(tx,result){
    		console.log("Result");
    		console.log(result);
    	},self.errorCB);
    	}, self.errorCB, function(tx){});*/
    },

    savePlaylists: function(){

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
            console.log("After error");
        }, self.errorCB, function(tx){});
        
    },

    errorCB: function(err) {
        console.error("Error processing SQL: ", err);
    }
};