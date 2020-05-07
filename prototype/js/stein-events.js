window.Stein = {
    systemLoaded: function(){
        window.parent.d3.select(window.parent.document.body)
        .dispatch('SteinEventSystemLoaded');
    },
    event: null
};

