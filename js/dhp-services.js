// PURPOSE: Special object serving common needs of DHPress projects and taxonomy pages
// USES:    JavaScript libraries jQuery, Underscore, (Zurb) Foundation ...
// NOTES: 	dhpServices needs text in dhp-script-services

	// Ensure that latest Array methods are defined
	// ============================================

if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
	enumerable: false,
	configurable: true,
	writable: true,
	value: function(predicate) {
	  if (this == null) {
		throw new TypeError('Array.prototype.find called on null or undefined');
	  }
	  if (typeof predicate !== 'function') {
		throw new TypeError('predicate must be a function');
	  }
	  var list = Object(this);
	  var length = list.length >>> 0;
	  var thisArg = arguments[1];
	  var value;

	  for (var i = 0; i < length; i++) {
		if (i in list) {
		  value = list[i];
		  if (predicate.call(thisArg, value, i, list)) {
			return value;
		  }
		}
	  }
	  return undefined;
	}
  });
}

// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.com/#x15.4.4.18
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (callback, thisArg) {
	var T, k;

	if (this == null) {
	  throw new TypeError(" this is null or not defined");
	}
	var O = Object(this);
	var len = O.length >>> 0;
	if (typeof callback !== "function") {
	  throw new TypeError(callback + " is not a function");
	}
	if (thisArg) {
	  T = thisArg;
	}
	k = 0;
	while (k < len) {
	  var kValue;
	  if (k in O) {
		kValue = O[k];
		callback.call(T, kValue, k, O);
	  }
	  k++;
	}
  };
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
	if (this == null) {
	  throw new TypeError('Array.prototype.find called on null or undefined');
	}
	if (typeof predicate !== 'function') {
	  throw new TypeError('predicate must be a function');
	}
	var list = Object(this);
	var length = list.length >>> 0;
	var thisArg = arguments[1];
	var value;

	for (var i = 0; i < length; i++) {
	  value = list[i];
	  if (predicate.call(thisArg, value, i, list)) {
		return i;
	  }
	}
	return -1;
  };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.io/#x15.4.4.19
if (!Array.prototype.map) {

  Array.prototype.map = function(callback, thisArg) {

	var T, A, k;

	if (this == null) {
	  throw new TypeError(" this is null or not defined");
	}
	var O = Object(this);
	var len = O.length >>> 0;
	if (typeof callback !== "function") {
	  throw new TypeError(callback + " is not a function");
	}
	if (arguments.length > 1) {
	  T = thisArg;
	}
	A = new Array(len);
	k = 0;
	while (k < len) {
	  var kValue, mappedValue;
	  if (k in O) {
		kValue = O[k];
		mappedValue = callback.call(T, kValue, k, O);
		A[k] = mappedValue;
	  }
	  k++;
	}
	return A;
  };
}

	// Interface between embedded YouTube player and code that uses it
	// This is called once iFrame and API code is ready
	// Need to determine whether this calls dhpWidget or dhpPinboard animation...
	// Must be here because it is used both on Project pages and Archive pages!
function onYouTubeIframeAPIReady()
{
		// Viewing pinboard but video player not yet instantiated yet it is loading
	if (typeof(dhpPinboardView) === 'undefined') {
		dhpWidget.bindPlayerHandlers();        
	} else {
		if (dhpPinboardView.vidPlayer==null && dhpPinboardView.playState==dhpPinboardView.STATE_LOADING) {
			dhpPinboardView.onYouTubeAPIReady();
		} else {
			dhpWidget.bindPlayerHandlers();        
		}
	}
}

	// PURPOSE: This Object contains methods to service & coordinate common needs of DH Press visualizations
var dhpServices = {
		// CONSTANTS
	timeInstant: 1,
	timeFuzzyStart: 2,
	timeFuzzyEnd: 4,

		// LOCALIZED TEXT
	dateAbout: null,
	dateNoLater: null,
	dateAtLeast: null,
	dateFromTo: null,

		// LOCAL PROPERTIES
	ajaxURL: null,
	projectID: null,
	projSettings: null,         // Project Settings
	pngData: null,
	markerURL: null,

	parseTimeCode: /(\d\d)\:(\d\d)\:(\d\d)\.(\d\d?)/,         // an exacting regular expression for parsing time

		// PURPOSE: Provide data about DH Press needed to carry out other services
	initialize: function(theAjaxURL, theProjID, theSettings, theMarkerURL)
	{
		ajaxURL = theAjaxURL;
		projectID = theProjID;
		projSettings = theSettings;
		markerURL = theMarkerURL;
		dhpServices.dateNoLater = "#dhp-date-nolater";
		dhpServices.dateAtLeast = "#dhp-date-atleast";
		dhpServices.dateAbout  = "#dhp-date-about";
		dhpServices.dateFromTo  = "#dhp-date-from-to";
	}, // initialize()


	setPNGData: function(thePNGData)
	{
		pngData = thePNGData;
	}, // setPNGData()

		// PURPOSE: Find the URL for a PNG image given its title
	getPNGurl: function(pngTitle)
	{
		if (pngData === null) {
			throw new Error("PNG data not set");
		}
		if (pngData.length == 0) {
			throw new Error("PNG data array empty");
		}
		var pngItem = _.find(pngData, function(thePNG) { return thePNG.title === pngTitle; } );
		if (pngItem === null) {
			throw new Error("PNG data item not found by title "+pngTitle);
		}
		return pngItem.url;
	}, // findPNGurl

		// PURPOSE: Create multi-legend Legend key for the visualization
		// INPUT:   legendList = array of legends to display; each element has field "name" and array "terms" of [id, name, icon_url ]
		//          layerTitle = label for the Layers panel (or null if none)
		// NOTES:   Handles user interaction with Legend itself, but not actions connected to visualization
		//          legend-head div must have already been inserted at appropriate place
	createLegends: function(legendList, layerTitle)
	{
		var legendHtml;

			// Build Legend controls on the right (category toggles) for each legend value and insert Legend name into dropdown above
		_.each(legendList, function(theLegend, legIndex) {
			var filterTerms = theLegend.terms;
			var legendName = theLegend.name;

				// "Root" DIV for this particular Legend
			legendHtml = jQuery('<div class="legend-div" id="term-legend-'+legIndex+
							'"><div class="legend-title">'+legendName+'</div><div class="terms"></div></div>');
				// Create entries for all terms (though 2nd-level children are made invisible)
			_.each(filterTerms, function(theTerm) {
				if (legendName !== theTerm.name) {
					var hasParentClass = '';
						// Make 2nd-level children invisible with CSS
					if (theTerm.parent) {
						hasParentClass = 'hasParent';
					}
					if (theTerm.icon_url == null || theTerm.icon_url == undefined) {
						// throw new Error("Legend value "+theTerm.name+" has not been assigned a color or icon");
						theTerm.icon_url = '#888888';
					}

					var firstIconChar = theTerm.icon_url.charAt(0);
					var htmlStr;

					switch (firstIconChar) {
					case '#':
						htmlStr = '<div class="small-2 large-2 columns" style="background:'+
							theTerm.icon_url+'"><input type="checkbox" checked="checked"></div>';
						break;
					case '.':
						htmlStr = '<div class="small-1 large-1 columns"><div class="maki-icon '+
							theTerm.icon_url.substring(1)+'"></div></div><input type="checkbox" checked="checked">';
						break;
					case '@':
						htmlStr = '<div class="small-1 large-1 columns"><img class="png" src="'+
							dhpServices.getPNGurl(theTerm.icon_url.substring(1))+'"/></div><input type="checkbox" checked="checked">';
						break;
					default:
							// TO DO: Support uploaded images!
						throw new Error('Unknown visual feature: '+theTerm.icon_url);
					}

						// Append new legend value to menu according to type
					jQuery('.terms', legendHtml).append('<div class="row compare '+hasParentClass+'">'+htmlStr+
													'<div class="small-10 large-10 columns"><a class="value" data-id="'+
													theTerm.id+'" data-parent="'+theTerm.parent+'">'+theTerm.name+'</a></div></div>');
				}
			});
			jQuery('.terms',legendHtml).prepend(jQuery("#dhp-script-legend-hideshow").html());

			jQuery('#legends .legend-row').append(legendHtml);
				// Add Legend title to dropdown menu in navbar -- make 1st Legend active by default
			var active = (legIndex == 0) ? ' class="active"' : '';
			jQuery('.dhp-nav .legend-dropdown').append('<li'+active+'><a href="#term-legend-'+legIndex+'">'+legendName+'</a></li>');         
		});
			// Add Layers div to legends (if any)
		if (layerTitle) {
			jQuery('#legends .legend-row').append('<div class="legend-div" id="layers-panel"><div class="legend-title">'+layerTitle+'</div></div>');
		}

		if (legendList.length) {
				// Hide all Legends, except 0 by default
			jQuery('.legend-div').hide();
			jQuery('#term-legend-0').show();
			jQuery('#term-legend-0').addClass('active-legend');
		}

			// Update checkbox height(varies by theme/browser) 
		// checkboxHeight = jQuery('#legends').find('input:checkbox').height();
			// Save height for min/max
		legendHeight = jQuery('#legends').height();

			//Initialize new foundation elements
		jQuery(document).foundation();

		jQuery('#legends').prepend('<a class="legend-resize btn pull-right" href="#" alt="mini"><i class="fi-arrows-compress"></i></a>');

			// Add legend Min-Max expand/contract action
		jQuery('.legend-resize').click( function() {
			if (jQuery('#legends').hasClass('mini')) {
				jQuery('#legends').animate({ height: legendHeight },
					500,
					function() {
						jQuery('#legends').removeClass('mini');
					});
			} else {
				jQuery('#legends').addClass('mini');
				jQuery('#legends').animate({ height: 37 }, 500 );
			}
		});
	}, // createLegends()


		// PURPOSE: Create a single-legend Legend key
		// INPUT:   legendName = name of legend (String)
		//          legendList = array of Legend terms
		// NOTES:   Handles user interaction with Legend itself, but not actions connected to visualization
		//          legend-head div must have already been inserted at appropriate place
		//          Handles maki-icons though they are not actually supported yet in relevant visualizations
	create1Legend: function(legendName, legendList) {
		var legendHtml;

			// "Root" DIV for the Legend
		legendHtml = jQuery('<div class="legend-div"><div class="legend-title">'+legendName+'</div><div class="terms"></div></div>');
			// Create entries for all of the 1st-level terms (do not represent children of terms)
		_.each(legendList, function(theTerm) {
			if (legendName !== theTerm.name) {
				var hasParentClass = '';
				if (theTerm.parent) {
					hasParentClass = 'hasParent';
				}
				var firstIconChar = theTerm.icon_url.charAt(0);
				switch (firstIconChar) {
				case '#':
						// Append new legend value to menu according to type
					jQuery('.terms', legendHtml).append('<div class="row compare '+hasParentClass+'">'+
						'<div class="small-1 large-1 columns splash" style="background:'+theTerm.icon_url+'"></div>'+
						'<div class="small-11 large-11 columns"><a class="value" data-id="'+
						theTerm.id+'" data-parent="'+theTerm.parent+'">'+theTerm.name+'</a></div></div>');
					break;
				case '.':
					jQuery('.terms', legendHtml).append('<div class="row compare '+hasParentClass+'">'+
						'<div class="small-2 large-1 columns"><div class="maki-icon '+
						theTerm.icon_url.substring(1)+'"></div></div><input type="checkbox" checked="checked">'+
						'<div class="small-9 large-10 columns"><a class="value" data-id="'+
						theTerm.id+'" data-parent="'+theTerm.parent+'">'+theTerm.name+'</a></div></div>');
					break;
				case '@':
					jQuery('.terms', legendHtml).append('<div class="row compare '+hasParentClass+'">'+
						'<div class="small-1 large-1 columns"><img class="png" src="'+
						dhpServices.getPNGurl(theTerm.icon_url.substring(1))+'"/></div><input type="checkbox" checked="checked">'+
						'<div class="small-9 large-10 columns"><a class="value" data-id="'+
						theTerm.id+'" data-parent="'+theTerm.parent+'">'+theTerm.name+'</a></div></div>');
					break;
				default:
					throw new Error('Visual feature not supported for Legend: '+theTerm.icon_url);
				}
			}
		});

		jQuery('#legends').append(legendHtml);

			// Update checkbox height (varies by theme/browser)
		// checkboxHeight = jQuery('#legends').find('input:checkbox').height();
			// Save height for min/max
		legendHeight = jQuery('#legends').height();

		jQuery('#legends').prepend('<a class="legend-resize btn pull-right" href="#" alt="mini"><i class="fi-arrows-compress"></i></a>');

			// Add legend hide/show action
		jQuery('.legend-resize').click(function() {
			if (jQuery('#legends').hasClass('mini')) {
				jQuery('#legends').animate({ height: legendHeight },
					500,
					function() {
						jQuery('#legends').removeClass('mini');
					});
			} else {
				jQuery('#legends').addClass('mini');
				jQuery('#legends').animate({ height: 37 }, 500 );
			}
		});
	}, // create1Legend()


		// PURPOSE: Takes nested array(s) of Legend terms and converts to flat array with fields:
		//              id, parent, name, icon_url
		// NOTES:   In array returned by php, parent markers have <id> field but children have <term_id>
		// RETURNS: Object with new properties: terms
	flattenTerms: function(oldTerms)
	{
		var newTerms = oldTerms;
		var termArray = [];

		_.each(oldTerms.terms, function(theTerm) {
			termArray.push(theTerm);
			_.each(theTerm.children, function(theChild) {
				termArray.push( {
					id: theChild.term_id,
					parent: theTerm.id,
					icon_url: theTerm.icon_url,    // child inherits parent's viz
					name: theChild.name
				});
			});
		});

		newTerms.terms = termArray;

		return newTerms;
	}, // flattenTerms()


		// PURPOSE: Find a Legend filter record that matches a category term in the Marker
		// RETURNS: The matching Legend filter (the parent in case of 2ndary level) or null (no match)
		// INPUT:   catTerms = array of category IDs (integers) associated with a feature/marker
		//          legendTerms = array of category IDs for Legend key
		// NOTES:   Will return first match found
		//          This could be optimized if legendTerms and/or catTerms were guaranteed to be in numeric order
	findCatTermInLegend: function(catTerms, legendTerms)
	{
		var countCats = catTerms.length;

		if (countCats) {
			var countTerms = legendTerms.length;
			var thisCat, thisCatID;
			var thisMarkerID;
			var catChildren;
			var i,j,k;

			for(i=0;i<countTerms;i++) {         // for all category terms in Legend
				thisCat = legendTerms[i];
				thisCatID = thisCat.id;

				for(j=0; j<countCats; j++) {      // for all terms IDs in Marker
					// legend categories
					thisMarkerID = catTerms[j];
						// have we matched this element?
					if (thisCatID===thisMarkerID) {
						return thisCat;
						// check for matches on its children
					} else {
						catChildren = thisCat.children;
						if (catChildren) {
							for (k=0; k<catChildren.length; k++) {
								if (catChildren[k].term_id==thisMarkerID) {
									return thisCat;
								}
							}
						}
					}
			   }
			}
		}
			// no match: default with null result
		return null;
	}, // findCatTermInLegend()


		// RETURNS: Short Text Legend color for feature given a particular Legend filter or null (no match)
		// INPUT:   catTerms = array of category IDs (integers) associated with a feature/marker
		//          legendTerms = array of category IDs for Legend key
	getItemSTColor: function(catTerms, legendTerms)
	{
		var catMatch = dhpServices.findCatTermInLegend(catTerms, legendTerms);
		if (catMatch) {
			return catMatch.icon_url;
		} else {
			return null;
		}
	}, // getItemSTColor()


		// RETURNS: Short Text Legend color and black|white for feature given a particular Legend filter or null (no match)
		// INPUT:   catTerms = array of category IDs (integers) associated with a feature/marker
		//          legendTerms = array of category IDs for Legend key
	getItemSTColors: function(catTerms, legendTerms)
	{
		var catMatch = dhpServices.findCatTermInLegend(catTerms, legendTerms);
		if (catMatch) {
			return [catMatch.icon_url, (catMatch.black ? 'black' : 'white')];
		} else {
			return null;
		}
	}, // getItemSTColors()


		// PURPOSE: Get array of discrete values from Marker's given Short Text mote as Strings
		// RETURNS: An array of text labels for any legendTerms that exist in dataItem
		// NOTES:   Only returns (single case of) 1st level value names for 2ndary values
		//          There are two possible ways of approaching this:
		//            (1) Retrieve text for each mote setting, save in marker and parse text acc. to delimiter character of Mote
		//            (2) Save only indices in properties.categories, lookup each value in Legend keys and retrieve that text
		//          Since we need to support 2ndary-level hierarchical values, method (2) is best solution
		//          Also need to prevent redundancy due to multiple 2ndary-level child values of same parent
	getItemSTLabels: function(dataItem, legendTerms) {
		var results = [];
		var catTerms = dataItem.properties.categories;
		var countCats = catTerms.length;

		if (countCats) {
			var countTerms = legendTerms.length;
			var thisCat, thisCatID;
			var thisMarkerID;
			var catChildren;
			var i,j,k;

			for(i=0;i<countTerms;i++) {			// for all category terms in Legend
				thisCat = legendTerms[i];
				thisCatID = thisCat.id;

				for(j=0; j<countCats; j++) {	// for all terms IDs in Marker
					// legend categories
					thisMarkerID = catTerms[j];
						// have we matched this element at 1st level?
					if (thisCatID===thisMarkerID) {
						results.push(thisCat.name);
					} else {
							// check for a match on its children
						catChildren = thisCat.children;
						if (catChildren) {
							for (k=0; k<catChildren.length; k++) {
								if (catChildren[k].term_id==thisMarkerID) {
										// Don't add label if already exists
									if (!_.find(results, function(mote) { return mote === thisCat.name; })) {
										results.push(thisCat.name);
									}
									break;
								}
							}
						}
					}
				}
			}
		}
		return results;
	}, // getItemSTLabels()


		// RETURNS: black or white, to contrast with given background color
		// INPUT:   bColor = color in format #xxxxxx where each x is a hexadecimal numeral
		// NOTES:   Algorithm for choosing white or black at:
		//            http://www.particletree.com/notebook/calculating-color-contrast-for-legible-text/
		//          and http://stackoverflow.com/questions/5650924/javascript-color-contraster
	getContrastColor: function(bColor)
	{
			// Prepare var for float value (? needed)
		var brightness = 1.1;

		brightness = ((parseInt(bColor.substr(1,2), 16) * 299.0) +
					(parseInt(bColor.substr(3,2), 16) * 587.0) +
					(parseInt(bColor.substr(5,2), 16) * 114.0)) / 255000.0;

		if (brightness >= 0.5) {
			return "black";
		} else {
			return "white";
		}
	}, // getContrastColor


		// RETURNS: Mote definition for mote whose name is moteName
	findMoteByName: function(moteName)
	{
		return _.find(projSettings.motes, function(theMote) {
			return (theMote.name === moteName);
		});
	}, // findMoteByName()

		// RETURNS: true if the Select Modal has a widget whose name is modalName
	modalViewHas: function(modalName)
	{
		return (_.find(projSettings.views.select.widgets,
						function(theName) { return (theName == modalName); }) != undefined);
	}, // modalViewHas()


		// PURPOSE: Remove the Loading pop-up modal dialog
	remLoadingModal: function()
	{
			// Need to add 250ms delay to prevent race condition (since open uses 250ms open animation)
		window.setTimeout(function() {
			jQuery('#loading').foundation('reveal', 'close');
		}, 250);
	}, // remLoadingModal()


		// PURPOSE: Fill out and show modal for marker
		// INPUT:   feature = the feature selected to show (in same format as generated by createMarkerArray())
		// SIDE-FX: Modifies DOM to create modal dialog window
	showMarkerModal: function(feature)
	{
		var selectParams = projSettings.views.select;
		var titleAtt;
		var builtHTML;
		var link1, link2, link1Target, link2Target;

		titleAtt = feature.title;
		link1  = feature.properties.link;
		link2  = feature.properties.link2;

			// Open in new tab?
		if (selectParams.linkNewTab) {
			link1Target = 'target="_blank"';
		}
		if (selectParams.link2NewTab) {
			link2Target = 'target="_blank"';
		}

			// Remove anything currently in body -- will rebuild from scratch
		jQuery('#markerModal .modal-body').empty();

			// Create playback widgets if there are A/V settings or transcript
		if (feature.properties.audio || feature.properties.video || feature.properties.transcript)
		{
			jQuery('#markerModal').addClass('transcript');

				// Clear out all widget settings
			var widgetSettings = {
				playerType: null,
				stream: null,
				transcript: null,
				transcript2: null,
				timecode: -1,
				startTime: -1,
				endTime: -1
			};

				// Configure player-specific data
			if (feature.properties.audio)
			{
				widgetSettings.stream = feature.properties.audio;
				widgetSettings.playerType = 'scloud';
			} else if (feature.properties.video)
			{
				widgetSettings.stream = feature.properties.video;
				widgetSettings.playerType = 'youtube';
			}

				// Configure transcript data
			if (feature.properties.timecode && feature.properties.timecode !== '') {
				widgetSettings.timecode = feature.properties.timecode;
				var time_codes = widgetSettings.timecode.split('-');
				widgetSettings.startTime = dhpServices.tcToMilliSeconds(time_codes[0]);
				widgetSettings.endTime   = dhpServices.tcToMilliSeconds(time_codes[1]);
			}
			if (feature.properties.transcript && feature.properties.transcript !== '') {
				widgetSettings.transcript  = feature.properties.transcript;
			}
			if (feature.properties.transcript2 && feature.properties.transcript2 !== '') {
				widgetSettings.transcript2 = feature.properties.transcript2;
			}

			dhpWidget.initialize(widgetSettings);
			dhpWidget.prepareOneTranscript(ajaxURL, projectID, '#markerModal .modal-body', true);
		} // playback widgets

			// Create HTML for all of the data related to the Marker
		if (selectParams.content) {
			builtHTML = '';
				// Go through each of the motes specified to be shown in select modal
			_.each(selectParams.content, function(cMote) {
				builtHTML += dhpServices.moteValToHTML(feature, cMote);
			}); // _.each()
		}

		jQuery('#markerModal .modal-body').append(builtHTML);

			// clear previous marker links
		jQuery('#markerModal .reveal-modal-footer .marker-link').remove();
			// Change title
		jQuery('#markerModal #markerModalLabel').empty().append(titleAtt);

			// setup links
		if (link1 && link1!='disable') {
			jQuery('#markerModal .reveal-modal-footer .button-group').prepend('<li><a '+link1Target+
				' class="button success marker-link" href="'+link1+'">'+selectParams.linkLabel+'</a></li>');
		}
		if (link2 && link2 !='disable') {
			jQuery('#markerModal .reveal-modal-footer .button-group').prepend('<li><a '+link2Target+
				' class="button success marker-link" href="'+link2+'">'+selectParams.link2Label+'</a></li>');
		}
			//Open modal
		jQuery('#markerModal').foundation('reveal', 'open');
	}, // showMarkerModal()


		// RETURNS: true if touch control is active (and hence no mouse)
	isTouchDevice: function()
	{
		// var msTouchEnabled = window.navigator.msMaxTouchPoints;
		// var generalTouchEnabled = "ontouchstart" in document.createElement("div");

		// if (msTouchEnabled || generalTouchEnabled) {
		//     return true;
		// }
		// return false;
		return (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
	}, // isTouchDevice()


		// PURPOSE: Create a single Date from three numbers
		// INPUT:   year, month, day must be definite numbers
		// NOTE:    month is 0-based (not 1-based: 0=January)
	createDate3Nums: function(year, month, day)
	{
		var date;

		if (year < 0 || year > 99) { // 'Normal' dates
			date = new Date(year, month, day);
		} else if (year == 0) { // Year 0 is '1 BC'
			date = new Date (-1, month, day);
		} else {
			// Create arbitrary year and then set the correct year
			date = new Date(year, month, day);
			date.setUTCFullYear(("0000" + year).slice(-4));
		}
		return date;
	}, // createDate3Nums


		// PURPOSE: Create a single Date from three strings
	createDate3Strings: function(yStr, mStr, dStr, from)
	{
		var yearBCE;
		var year, month, day;

			// First check for negative year
		if (yStr.charAt(0) == '-') {
			yearBCE = true;
			yStr = yStr.substring(1);
		} else {
			yearBCE = false;
		}

		year = parseInt(yStr);
		if (yearBCE) {
			year = -year;
		}

			// If it's a start date, defaulted data must be early as possible

		if (dStr == null || dStr === '') {
			if (mStr == null || mStr ==='') {
				if (from) {
					month = 0; day = 1;
				} else {
					month = 11; day = 31;
				}
			} else {
				month = parseInt(mStr) - 1;
				if (from) {
					day = 1;
				} else {
					day = 31;
				}
			}
		} else {
			month = parseInt(mStr) - 1;
			day = parseInt(dStr);
		}

		return dhpServices.createDate3Nums(year, month, day);
	}, // createDate3Strings()


		// PURPOSE: Parse a text string as a single Date
		// RETURNS: Date object or null if error
		// INPUT:   dateString = string itself containing Date
		//          from = true if it is the from Date, false if it is the to Date
		// ASSUMES: dateString has been trimmed; can ignore fuzzy char ~
		// NOTE:    month # is 0-based!!
	parseADate: function(dateString, from)
	{
		var strComponents;
		var yearBCE;
		var year, month, day;

			// Check for fuzzy char indicator -- but discard if exists
		if (dateString.charAt(0) == '~') {
			dateString = dateString.substring(1);
		}

			// Check for negative year
		if (dateString.charAt(0) == '-') {
			yearBCE = true;
			dateString = dateString.substring(1);
		} else {
			yearBCE = false;
		}

		strComponents = dateString.split('-');

			// Year must be supplied at very least
		year = parseInt(strComponents[0]);
		if (yearBCE) {
			year = -year;
		}
			// If it's a start date, we want defaulted data to be early as possible
		switch (strComponents.length) {
		case 3:
			month = parseInt(strComponents[1]) - 1;
			day = parseInt(strComponents[2]);
			break;
		case 2:
			month = parseInt(strComponents[1]) - 1;
			if (from) {
				day = 1;
			} else {
				day = 31;
			}
			break;
		case 1:
			if (from) {
				month = 0; day = 1;
			} else {
				month = 11; day = 31;
			}
			break;
		} // switch

		return dhpServices.createDate3Nums(year, month, day);
	}, // parseADate()


		// PURPOSE: Create event object by parsing Date range string (which can have from & to)
		// RETURNS: Event object whose bitwise flags field represent three properties:
		//              timeInstant = is this an instantaneous event?
		//              timeFuzzyStart = is the beginning event fuzzy?
		//              timeFuzzyEnd = is the end event fuzzy?
		// INPUT:   dStr = text string representing a Date (range)
		//          minBound = minimum Date in range
		//          maxBound = maximum Date in range
	eventFromDateStr: function(dStr, minBound, maxBound)
	{
		var newEvent = { flags: 0 };

		var dateSegs = dStr.split('/');

		var start = dateSegs[0].trim();
		if (start === 'open') {
			newEvent.start = minBound;
		} else {
			if (start.charAt(0) === '~') {
				start = start.substr(1);
				newEvent.flags |= dhpServices.timeFuzzyStart;
			}
			newEvent.start = dhpServices.parseADate(start, true);
		}

			// Is it a range of from/to?
		if (dateSegs.length == 2) {
			var end = dateSegs[1].trim();
			if (end === 'open') {
				newEvent.end = maxBound;
			} else {
				if (end.charAt(0) === '~') {
					end = end.substr(1);
					newEvent.flags |= dhpServices.timeFuzzyEnd;
				}
				newEvent.end = dhpServices.parseADate(end, false);
			}

			// Otherwise an instantaneous event -- just set to start Date
		} else {
			newEvent.flags |= dhpServices.timeInstant;
			newEvent.end = newEvent.start;
		}

		return newEvent;
	}, // eventFromDateStr


		// PURPOSE: Format mote value as HTML
		// RETURNS: Complete HTML string for displaying the mote value
	moteValToHTML: function(markerData, moteName)
	{
		function dateExplain(dateStr, from)
		{
			if (dateStr.charAt(0) === '~') {
				if (from) {
					theString = dhpServices.dateNoLater;
				} else {
					theString = dhpServices.dateAtLeast;
				}
				return dhpServices.compileText(theString, { date: dateStr.substr(1) });
			} else 
				return dateStr;
		} // dateExplain()

		var builtHTML='';
		var mVal = markerData.properties.content[moteName];

			// As these are not motes, need to catch first
		if (moteName === 'the_title' || moteName === 'the_content') {
			return '<div>'+mVal+'</div>';
		}

		var moteDef = dhpServices.findMoteByName(moteName);

		if (mVal) {
			switch (moteDef.type) {
			case 'Date':
				var dateSegs = mVal.split('/');
				var start = dateSegs[0].trim();
				if (dateSegs.length == 1) {
					
					var dateStr;
					if (start.charAt(0) === '~') {
						dateStr = dhpServices.compileText(dhpServices.dateAbout, { date: start.substr(1) });
					} else {
						dateStr = start;
					}
					builtHTML = '<div><span class="dhp-mote-title">'+moteName+'</span>: '+dateStr+'</div>';
				} else {
					builtHTML = '<div><span class="dhp-mote-title">'+moteName+'</span>: '+
						dhpServices.compileText(dhpServices.dateFromTo, { d1: dateExplain(start, true), d2: dateExplain(dateSegs[1].trim(), false) });+
						'</div>';
				}
				break;
			case 'Image':
				if (moteName==='Thumbnail Right') {
					builtHTML = '<div class="thumb-right">'+mVal+'</div>';
				} else if (moteName==='Thumbnail Left') {
					builtHTML = '<div class="thumb-left">'+mVal+'</div>';
				} else {
					builtHTML = '<div><span class="dhp-mote-title">'+moteName+'</span><br/>'+mVal+'</div>';
				}
				break;
			case 'Link To':
				builtHTML = '<div><a href="'+mVal+'" target="_blank">'+
						dhpServices.compileText('#dhp-btnlbl-linkto', { name: moteName })+'</a></div>';
				break;
			case 'SoundCloud':
				builtHTML = '<div><a href="'+mVal+'" target="_blank">'+
					dhpServices.getText('#dhp-btnlbl-sndcld')+'</a></div>';
				break;
			case 'YouTube':
				builtHTML = '<div><a href="https://www.youtube.com/watch?v='+mVal+'" target="_blank">' +
						dhpServices.getText('#dhp-btnlbl-youtube')+'</a></div>';
				break;
			case 'Transcript':
				builtHTML = '<div><a href="'+mVal+'" target="_blank">'+
						dhpServices.getText('#dhp-btnlbl-transcript')+'</a></div>';
				break;
			// case 'Pointer':
			//     var parsed;
			//     if (moteDef.delim && moteDef.delim !== '' && moteDef.delim !== ' ') {
			//         parsed = mVal.split(moteDef.delim);
			//     } else {
			//         parsed = [mVal];
			//     }
			//     builtHTML = '<div><a href="'+markerURL+parsed[0]+'" target="_blank"> See '+moteName+' webpage</a></div>';
			//     break;
				// else, fall through to default logic
			case 'Long Text':
				if (mVal === '~|~') {
					break;
				}
				// fall through to default logic to construct string
			default:
				if (moteName === 'the_content') {
					builtHTML = '<div>'+mVal+'</div>';
				} else {
					builtHTML = '<div><span class="dhp-mote-title">'+moteName+'</span>: '+mVal+'</div>';
				}
				break;
			} // switch type
		} // if mVal

		return builtHTML;
	}, // moteValToHTML()


		// PURPOSE: Convert timecode string into # of milliseconds
		// INPUT:   timecode must be in format [HH:MM:SS] or [HH:MM:SS.ss]
		// ASSUMES: timecode in correct format, parseTimeCode contains compiled RegEx
	tcToMilliSeconds: function(timecode)
	{
		var milliSecondsCode = new Number();
		var matchResults;

		matchResults = dhpServices.parseTimeCode.exec(timecode);
		if (matchResults !== null) {
			// console.log("Parsed " + matchResults[1] + ":" + matchResults[2] + ":" + matchResults[3]);
			milliSecondsCode = (parseInt(matchResults[1])*3600 + parseInt(matchResults[2])*60 + parseFloat(matchResults[3])) * 1000;
				// The multiplier to use for last digits depends on if it is 1 or 2 digits long
			if (matchResults[4].length == 1) {
				milliSecondsCode += parseInt(matchResults[4])*100;
			} else {
				milliSecondsCode += parseInt(matchResults[4])*10;
			}
		} else {
			throw new Error("Error in transcript file: Cannot parse " + timecode + " as timecode.");
			milliSecondsCode = 0;
		}
		return milliSecondsCode;
	}, // tcToMilliSeconds()

		// PURPOSE: Retrieve language-dependent text embedded in script
	getText: function(scriptName)
	{
		return jQuery(scriptName).html().trim();
	},

		// PURPOSE: Retrieve language-dependent text and insert variables
		// INPUT:   scriptName = name of script text in DOM
		//          vars = names and values of variables in text
	compileText: function(scriptName, vars)
	{
		_.templateSettings = {
 			 interpolate: /\{\{(.+?)\}\}/g
		};

		var baseText = scriptName;

		if(typeof baseText == "string"){
			baseText = jQuery(scriptName).html().trim();
		}

		var template = _.template(baseText, vars);
		return template;
	} // compileText()
}; // dhpServices
