$(function() {
    var json = [];
    var field = $('.search-field');
    var container = $('.search-container');
    var icon = $('.search-form .fa-search');
    var label = $('.search-form .search-label');
    var results = $('.search-results ol');

    $.getJSON('/search.json', function(data) {
        json = data;
    });

    field.on('input', function() {
        if (field.val() !== '')
            search(field.val().toLowerCase());
        else
            results.empty();
    });

    container.on('click', function() {
        if (label.is(':visible')) {
            label.hide();
            field.animate({
                width: 'toggle'
            });
            field.focus();
        }
    });

    field.on('blur', function() {
        if (field.val() === '') {
            field.animate({
                width: 'toggle'
            }, {
                complete: function() {
                    label.show();
                }
            });
        }
    });

    $(window).scroll(function() {
        if ($(this).scrollTop() > 400)
            $('.top').fadeIn(200);
        else
            $('.top').fadeOut(200);
    });

    $(document).on('click', '.smooth-scroll', function(e) {
        e.preventDefault();
        var target = this.hash,
            $target = $(target);
        if (target == '') {
            target = '';
            $target = $('body');
        }
        $('html, body').stop().animate({
            'scrollTop': $target.offset().top
        }, 900, 'swing', function() {
            window.location.hash = target;
        });
    });

    function search(text) {
        var found = false;
        results.css('list-style', 'decimal');
        results.empty();
        $.each(json, function(i, v) {
            if (v.title.toLowerCase().search(text) !== -1) {
                results.append('<li><a href="' + v.url + '">' + v.title + '</a></li>');
                found = true;
            }
        });
        if (!found) {
            results.css('list-style', 'none');
            results.append('<li><p>Sorry, but what you were looking for was not found!</p></li>');
        }
    }
});
