/*
 *	This software is licensed under the CC-GNU GPL.
 *	License: http://creativecommons.org/license/cc-gpl
 *	Author:  Gyuris Gellért, 2008
 *	Web:	 http://halld.ujevangelizacio.hu/, http://bubu.ujevangelizacio.hu/
 */
var bibleMap={
	data : null,
	dataXML : null,
	init : function() {
		bibleMap.loadBookList("biblemap.xml");	
	},
	loadBookList : function(sURL) {
		$.ajax({ // az alap Biblia beolvasása
			type     :'GET',
			url      : sURL,
			dataType :'xml',
			complete :function(data) {
				bibleMap.dataXML = data.responseXML;
				$('#b-create').removeAttr('disabled');
			}
		});
	},
	create : function() {
		$('#b-create').attr('disabled','disabled');
		$("#status-frame").text("Olvasási sorrend feldolgozása");
		bibleMap.data = bibleMap.parseData($("#text-frame").text());
		$("#bible-frame").show();
		bibleMap.createBibleBookList(
			$.xmlToJSON(bibleMap.dataXML).book,
			$("#bible-frame")
		);
	},
	processData : function() {
		function specifyVerse( sId ) {
			if ($(sId).length == 0) {
				if ((aM = sId.match(/^(.+\d+)\w+/)) != null) return specifyVerse(aM[1]);
			};
			return sId;
		};
		function selectRead(o) {
			o.addClass("read");
			o.get(0).setAttribute("readtime",	Number(o.get(0).getAttribute("readtime"))+1);
			o.get(0).setAttribute("title", o.get(0).getAttribute("title") + " " + oData.group + " " + oData.day + " (" + oData.portion + ") " );
			if (("#" + o.attr("id")) == specifyVerse("#bm-" + oData.bookId + "-" + oData.endChapter + "-" + oData.endVerse)) return;
			if (o.is(":last-child")) selectRead(o.parent().next().children(":first"))
			else selectRead(o.next());
		};
		$('#b-process').attr('disabled','disabled');
		var i = 0, oData;
		var tId = setInterval(function(){
			oData = bibleMap.data[i];
			//list(oData.sortName+ "#bm-" + oData.bookId + "-" + oData.startChapter + "-" + oData.startVerse)
			$("#status-frame").text("Feldolgozás: " + oData.group + " " + oData.day + ": " + oData.portion);
			selectRead($(specifyVerse("#bm-" + oData.bookId + "-" + oData.startChapter + "-" + oData.startVerse)));
			i++;
			if ( i == bibleMap.data.length ) {
				clearInterval(tId);
				var x = $("#bible-frame > div > div > div");
				var y = $("#bible-frame > div > div > div.read");
				$("#status-frame").text("Az adatfeldolgozás befejeződött: " + x.length + " versből " + y.length + " olvasott: " + (new String(y.length/x.length*100).substring(0,5)) + "%" );
			};
		}, 10);
	},
	createBibleBookList : function(aBook, oBibleFrame) {
		var i = 0; 
		var tId = setInterval(function(){
			oBook = aBook[i], sHTML = '';
			oBook.bookId = bibleMap.trHU(oBook.sortName);
			$("#status-frame").text("Grafikon készül: "+oBook.name );
			sHTML += '<div id="bm-' + oBook.bookId + '"><span>' + oBook.sortName + '</span>';
			jQuery.each(oBook.chapter, function(j, oChapter){
				sHTML += '<div id="bm-' + oBook.bookId +'-' + oChapter.number + '">'
				aVerse = oChapter.verseList.split(";");
				jQuery.each(aVerse, function(k, sVerse){
					sHTML += '<div id="bm-'+ oBook.bookId +'-' + oChapter.number + '-' + sVerse + '" title="' + oBook.sortName + " " + oChapter.number + "," + sVerse +' "></div>'
				});
				sHTML += '</div>';
			});
			sHTML += '</div>';
			oBibleFrame.append(sHTML);
			i++;
			if ( i == aBook.length ) {
				clearInterval(tId);
				$('#b-process').removeAttr('disabled');
				$("#status-frame").text("A grafikon elkészült.");
			};
		}, 10);
	},
	parseData : function(sTxt) {
		function Part(sGroup, sDay, sBookSortName, sStartChapter, sStartVerse, sEndChapter, sEndVerse, sDetail) {
			this.group        = sGroup;
			this.day          = sDay;
			this.sortName     = sBookSortName.replace(/^Csel/, 'ApCsel').replace(/^1Tessz/, '1Tesz').replace(/^2Tessz/, '2Tesz')
			                                 .replace(/^1Pét/, '1Pt').replace(/^2Pét/, '2Pt').replace(/^1Ján/, '1Jn').replace(/^Bar/, 'Bár').replace(/^1Makk/, '1Mak')
											 .replace(/^2Makk/, '2Mak').replace(/^2Ján/, '2Jn').replace(/^3Ján/, '3Jn').replace(/^Mtörv/, 'MTörv').replace(/^Ezdr/, 'Ezd')
											 .replace(/^Eszt/, 'Esz').replace(/^Joel/, 'Jo').replace(/^Óz/, 'Oz').replace(/^Rúth/, 'Rut').replace(/^Agg/, 'Ag');
			this.bookId       = bibleMap.trHU(this.sortName);
			this.startChapter = sStartChapter;
			this.startVerse   = sStartVerse;
			this.endChapter   = sEndChapter
			this.endVerse     = sEndVerse;
			this.portion      = this.bookId + " " + sDetail;
			//$("#text-output").append(this.group+" ("+this.day+") - '"+this.sortName+" ["+this.bookId+"] "+this.startChapter+","+this.startVerse+"-"+this.endChapter+","+this.endVerse+" {"+this.portion+"}\n");
			return this;
		};
		var sGroup, aLine = sTxt.split("\n"), aReturnData = [];
		var myRe = /([\wÖÜÓŐÚÉÁŰÍöüóőúéáűí]{2,6})\s*([\d\w,\.-]+)/g;
		jQuery.each(aLine, function(i, sLine) {
			var sDay, sReading, sBookSortName, sDetail, sStartChapter, sStartVerse, sEndChapter, sEndVerse, aM;
			sLine = jQuery.trim(sLine);
			if (sLine.match(/^[\w\.\sÖÜÓŐÚÉÁŰÍ]+$/) !== null) {
				sGroup = sLine; // csoportnév
			};
			if((aM=sLine.match(/^(.+):\s*(.+)$/)) !== null) { // adatsor
				sDay = aM[1]; // nap neve
				sReading = aM[2]; // napi olvasmányok egyben
				//while ((aM=/([\wÖÜÓŐÚÉÁŰÍöüóőúéáűí]{2,6})\s*([\d\w,\.-]+)/g.exec(sReading)) !== null) {
				while ((aM=myRe.exec(sReading)) !== null) {
					sBookSortName = aM[1];
					sDetail = aM[2];
					aDetail = sDetail.split(".");
					jQuery.each(aDetail, function(i, sPart) {
						if ((aM=sPart.match(/(?:(?:(\d{1,3}),)?(\d{1,3}\w?)-)?(?:(\d{1,3}),)?(\d{1,3}\w?)/)) == null) return alert("Hibás megadott darabka: " + sPart);
						sEndVerse     = aM[4];
						sStartVerse   = (aM[2] !=undefined) ? aM[2] : sEndVerse;
						sStartChapter = (aM[1] !=undefined) ? aM[1] : (aM[3] != undefined && aM[2] == undefined) ? aM[3] : sStartChapter; // aM[1] : (aM[3] != undefined) ? aM[3] : sStartChapter;
						sEndChapter   = (aM[3] !=undefined) ? aM[3] : sStartChapter;
						aReturnData.push(new Part(sGroup, sDay, sBookSortName, sStartChapter, sStartVerse, sEndChapter, sEndVerse, sDetail));
					});
				};
			};
		});
		return aReturnData;
	},
	trHU : function(s) {
		return s.replace(/Ö/, 'O').replace(/Ü/, 'U').replace(/Ó/, 'O').replace(/Ő/, 'O')
            .replace(/Ú/, 'U').replace(/É/, 'E').replace(/Á/, 'A').replace(/Ű/, 'U')
            .replace(/Í/, 'I').replace(/ö/, 'o').replace(/ü/, 'u').replace(/ó/, 'o')
            .replace(/ő/, 'o').replace(/ú/, 'u').replace(/é/, 'e').replace(/á/, 'a')
            .replace(/ű/, 'u').replace(/í/, 'i');
	},
	createVerseListFromZefaniaSource : function() { // csak Firefox alá írt részlet! Élesbe nem megy, csak a Biblia előállításáshoz kellett
		/*function evaluateXPath(aNode, aExpr) { // innen emelve: https://developer.mozilla.org/en/Using_XPath 
		  var xpe = new XPathEvaluator();
		  var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ? aNode.documentElement : aNode.ownerDocument.documentElement);
		  var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
		  var found = [];
		  var res;
		  while (res = result.iterateNext()) found.push(res);
		  return found;
		};
		// a saját állományból a könyvek neveinek a bekérése
		var reqBookNames = new XMLHttpRequest();
	  reqBookNames.open('GET', 'bible.xml', true);  
    reqBookNames.onreadystatechange = function() {
			if (reqBookNames.readyState == 4) {
      	if (reqBookNames.status == 200) {
					var aBookNames = evaluateXPath(reqBookNames.responseXML,"//set[@name='A Vulgáta sorrendje']/element");
					var reqZefania = new XMLHttpRequest();
			    // a Zefania struktúrájú állományból a teljes Bibliaszövehg beolvasása a versek számának megállapításához
					reqZefania.open('GET', 'sf_deje.xml', true);  
			    reqZefania.onreadystatechange = function() {  
						if (reqZefania.readyState == 4) {
			      	if(reqZefania.status == 200) {
								var oJSON = {'bible' : {'book' : [] }}, aBook, aChapter, aVerse, aMatch, aVerse, aVerseList;
								aBook = evaluateXPath(reqZefania.responseXML,"//BIBLEBOOK") // "//BIBLEBOOK[@bname='Ester']"
								aBook.forEach(function(oBook, i) {
									oJSON.bible.book.push({
										"@bname"   : oBook.getAttribute("bname"),
										"@basname" : oBook.getAttribute("bsname"),
										"@name"    : aBookNames[i].getAttribute("name"),
										"@sortName": aBookNames[i].getAttribute("sortName"),
									});
									aChapter = evaluateXPath(oBook, "CHAPTER");
									oJSON.bible.book[oJSON.bible.book.length-1].chapter=[];
									for each(oChapter in aChapter){
										aVerseList = [];
										aVerse     = evaluateXPath(oChapter, "VERS | ATRANS");
										for each(oVerse in aVerse){
											if (oVerse.hasAttribute("vnumber")) {
												aVerseList.push(oVerse.getAttribute("vnumber"));
											}
											else if (oVerse.hasAttribute("vref")) {
												aMatch=oVerse.textContent.match(/\d+,\s?(\w+)\s/);
												aVerseList.push(aMatch[1]);
											};
										};
										oJSON.bible.book[oJSON.bible.book.length-1].chapter.push({
											"@number"    : oChapter.getAttribute("cnumber"),
											"@verseList" : (aVerseList.join(";"))
										});
									};
								});
								$("#xml-output").val(json2xml(eval(oJSON)));
							};  
			   		}; 
			 		};  
				 	reqZefania.send(null);      		
				}
			}	
		};
		reqBookNames.send(null);*/	
	}
};
