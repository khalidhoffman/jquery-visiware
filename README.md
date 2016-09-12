# jquery-visiware
Another jQuery Plugin. Useful for scroll events.

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
Property Name               | Default | Type      | Description
----------------------------|---------|-----------|---------------------------------------------------------
once                        | false   | Boolean   | Whether to call visibility function once
triggerAreaPercent          | .75     | Float     | Amount of scroll distance relative to the elements height required to trigger event
onScrollOnly                | false   | Boolean   | Whether to only check for visibility on scroll
once                        | false   | Boolean   | Whether to execute only once
onScrolled                  | false   | Function  | Executes when element has been scrolled passed 
onVisible                   | false   | Function  | Executes when the element is considered visible
onVisibleTick               | false   | Function  | Executes on each tick during which the element is considered visible. arguments: (percentVisible, vaeInstance, index)
onEntirelyVisible           | false   | Function  | Executes when the element is entirely visible
onHidden                    | false   | Function  | Executes when the element is not visible
isVisibleTriggerActive      | false   | Boolean   | Whether to trigger 'visible' events
isEntireVisibleTriggerActive| false   | Boolean   | Whether to trigger 'entirelyVisible' events
isScrolledTriggerActive     | false   | Boolean   | Whether to trigger 'scrolled' events

## Methods
Method Name                 | Description
----------------------------|-------------------------------------------------------
activate                    | Starts listening on the `vaeInstance`
deactivate                  | Stops listening on the `vaeInstance`
empty                       | Stops listening on all `vaeInstance`s
update                      | Updates scroll points and options on `vaeInstance`
get                         | Accepts either 'scrollStartPoint' or 'scrollEndPoint' as secondary arguments. Returns each respectively
isActive                    | Returns whether the `vaeInstance` is listening for scroll changes

