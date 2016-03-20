# jquery-visiware
Another jQuery UI Plugin. Useful for scroll events.

## Example Usage
```javascript
 var $animatedElements = $('.fadeIn, .fadeInDown');

    $animatedElements.each(function (index, el) {
        $(el).visiware({
            once: true,
            onVisible: function () {
                this.element.addClass('visible');
            }
        }).visiware('activate');
    });
```

## Options
Property Name       | Default | Type      | Description
--------------------|---------|-----------|---------------------------------------------------------
once                | false   | Boolean   | Whether to call visiblity function once
triggerAreaPercent  | .75     | Float     | Amount of scroll distance relative to the elements height required to trigger event
onScrollOnly        | false   | Boolean   | Whether to only check for visiblity on scroll
once                | false   | Boolean   | Whether to execute only once
onScrolled          | false   | Function  | executes when element has been scrolled passed 
onVisible           | false   | Function  | executes when the element is considered visible
onEntirelyVisible   | false   | Function  | executes when the element is entirely visible
onHidden            | false   | Function  | executes when the element is not visible
