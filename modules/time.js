module.exports = { 
    datetime: function(currentTime) {    
        return currentTime.getDate() + "/"
                + (currentTime.getMonth()+1)  + "/" 
                + currentTime.getFullYear() + " @ "  
                + currentTime.getHours() + ":"  
                + currentTime.getMinutes() + ":" 
                + currentTime.getSeconds();
    }
};