# Events

Miew allows tracking some important changes inside him.
Users of the Miew library have a chance to subscribe to Miew events in which they are interested in and create handlers for them.

## Instruction how to subscribe to Miew event

  1. Find an event on which you want to subscribe (you can see all Miew events in next part).
  2. Use Miew method addEventListner(string eventType, function handler). Usually, it looks like one of the following variants:
        - `*.addEventListner('eventType', () => { ... });` - if in handler you don't need additional event information;
        - `*.addEventListner('eventType', (e) => { ... e.ArgumentName ... });` - if you want to use in handler some additional event information.

Here you can find an example: https://github.com/epam/miew/blob/master/examples/events.js


## Events list
### Rotating, translating and scaling events
These events are sent after rotating, translating or scaling molecule (or it's fragment or multiple molecules)

Type                    |Argument                               |Description
---                     |---                                    |---
**rotate**              |_quaternion_: last rotation	        |On rotation
**zoom**	            |_number_: previous scale/current scale	|On scaling
**translate**	        |-	                                    |On component translation in XY plane (parallel to screen)
**translatePivot**	    |-	                                    |On fragment or all molecules translation in XY plane (parallel to screen)
**transform**	        |-	                                    |After each of the listed above events changing


### Representation events
Type            |Argument                                                   |Description
---             |---                                                        |---
**repAdded**    |_number_: rep index <br> _string_: molecule's name  |After each representation adding
**repChanged**	|_number_: rep index <br> _string_: molecule's name  |After each representation changing
**repRemoved**	|_number_: rep index <br> _string_: molecule's name  |After each representation removing


### Miew continuous processes events
#### Continuous long processes
Type            |Argument                           |Description
---             |---                                |---
**loading**	    |_string/file_: molecule source to load <br> _object_: options (data source type, data contents type, etc.) |On loading
**fetching**    |-	                                |On fetching
**parsing**	    |-	                                |On parsing
**rebuilding**	|-	                                |On rebuilding
**exporting**	|-	                                |On exporting to *.fbx

#### Ending of processes
Type                |Argument                   |Description
---                 |---                        |---
**loadingDone**	    |result: name or error	    |On loading end
**fetchingDone**	|result: data or error	    |On fetching end
**parsingDone**	    |result: data or error	    |On parsing end
**buildingDone**	|-	                        |On building end
**exportingDone**	|-	                        |On exporting end


### Settings changing events
**Pay attention to these events, they are sent from Miew.settings (not from Miew as others).**

Look at the example: https://github.com/epam/miew/blob/master/examples/miew_via_react/components/ViewerContainer.js

Type                                                    |Argument |Description
---                                                     |---      |---
change:SettingPath <br> SettingPath - any field of **defaults** in settings.js <br> <br> Example: **change:outline.on**  |-        |On changing the value of correspondent setting


### Other events
Type                |Argument                                       |Description
---                 |---                                            |---
**resize**	        |-	                                            |On resize work area <br> <ul> <li>During initialization<li>After each resizing<li>on the first time when the stereo mode is set to WEBVR
**newPick**	        |_object_: empty object or picked object	    |On click inside Miew work area
**titleChanged**	|_string_: new title	                        |After title inside Miew was changed
**editModeChanged**	|_boolean_: is current mode complex edit mode	|After edit mode was changed
