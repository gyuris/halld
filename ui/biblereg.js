/*
 *	This software is licensed under the CC-GNU GPL.
 *	License: http://creativecommons.org/license/cc-gpl
 *	Author:  Gyuris Gellért, 2008
 *	Web:	 http://halld.ujevangelizacio.hu/, http://bubu.ujevangelizacio.hu/
 */
var bibleReg={
	set:[],
	error:{
		parseDay:'Hibás a napok száma!',
		overmuchDay:'Több nap,mint fejezet! Ennek nem sok értelme lenne így… A kért fejezetek száma: ',
		distribution:'Hiba az egyenletes eloszlás számításában!'
	},
	create:function(nDay) { // napi fejezetbeosztás készítése az aktuális fejezet-sorrendből
		// változók
		try { 
			nDay=Math.round(Math.abs(parseInt(eval(nDay))));
		} catch (e) {
			return alert(this.error.parseDay);
		};
		if (nDay==0) return alert(this.error.parseDay);
		var i,j,k,x,y,a,s,d,series=[],day=[],distribution=[],lower={},upper={};
		// sorozat készítése
		$('#biblereg-editor li').each(function() {
			if (this.firstChild.checked==true) {
			j=parseInt($(this).attr('start'));
			k=parseInt($(this).attr('end'));
				for (;j<=k;j++) {
					series.push({'sortName':$(this).attr('sortName'),'chapter':String(j)});
				};
			};
		});
		if (nDay > series.length) return alert(this.error.overmuchDay + series.length);
		// eloszlás arányainak számítása
		upper.num=Math.ceil(series.length/nDay);
		lower.num=Math.floor(series.length/nDay);
		upper.bit=series.length%nDay;
		lower.bit=nDay-upper.bit;
		if (upper.bit*upper.num+lower.bit*lower.num!=series.length) return alert(this.error.distribution);
		// egyenletes eloszlás számítása
		j=upper.bit;
		k=lower.bit;
		while (j+k!=0) {
			x=j/upper.bit;
			y=k/lower.bit;
			if (x==y||Math.max(x,y)==x) {
				j--;
				distribution.push(upper.num);
			} else {
				k--;
				distribution.push(lower.num);
			};
		};
		// rendezés napokba
		i=0;
		a=series.slice(0,series.length);
		while (a.length!=0) {
			day.push(a.splice(0,distribution[i]));
			i++;
		};
		// kiiratás:törlés
		$('#biblereg-result').empty();
		$('#biblereg-comment').empty().hide();
		// eloszlás vizualizálása
		if ( $('#biblereg-days').attr('checked') ) {
			for (i=0;i<day.length;i++) {
				$('#biblereg-comment').append('<span class='+((distribution[i]==lower.num) ? 'type-lower':'type-upper')+'></span>');
			};
			$('#biblereg-comment').show();
		};
		//for ( i = 0; i<day.length; i++) { s =''; for ( j= 0; j<day[i].length; j++) { s += day[i][j].sortName + ' ' + day[i][j].chapter + '; ';}; $('#biblereg-result').append('<li>'+ s+'</li>');} return
		// emberi formájú kiiratás, átalakítás
		if ($('#biblereg-date').attr('checked')) { // megadott dátum lekérdezése
			d = $.datepicker.parseDate('yy.mm.dd.', $('#biblereg-startday').val());
			d.setDate(d.getDate()-1);
		};
		for (i=0;i<day.length;i++) {
			// vágójelek beillesztése
			for (j=0;j<day[i].length;j++) {
				if (day[i][j].sortName!=k && j!=0) { // vágás, ha új kezdődik - de az elején nem
					day[i].splice(j,0,'|');
					j++;
				};
				if (j==day[i].length-1) { // vágás a végén
					day[i].splice(j+1,0,'|');
					j++;
				};
				k=day[i][j].sortName;
			};
			//s = ''; for ( j = 0; j < day[i].length; j++ ) { s += ( day[i][j] == '|') ? ' ----- ' : day[i][j].sortName + ' ' + day[i][j].chapter + ' '}; $('#biblereg-result').append('<li>'+s+'</li>'); continue;
			// összevonás a vágójelek mentén
			a=[];
			j=0,k=0;
			while (day[i].length!=0) {
				if (day[i][j]=='|') {
					a.push({sortName:day[i][j-1].sortName,start:day[i][k].chapter,end:day[i][j-1].chapter});
					day[i].splice(0,j+1);
					j=0,k=0;
				};
				j++;
			};
			day[i]=a;
			//$('#biblereg-result').append('<li>'+day[i]+'</li>'); continue;
			// kiiratás
			s='';
			for (j=0;j<day[i].length;j++) {
				s+=day[i][j].sortName+' '+day[i][j].start;
				if (day[i][j].start!=day[i][j].end) {
					s+='–'+day[i][j].end;
				}
				if (j !=day[i].length - 1){
					s+='; ';
				};
			};
			if ($('#biblereg-date').attr('checked')) d.setDate(d.getDate()+1);
			$('#biblereg-result').append('<li>'
				+($('#biblereg-date').attr('checked') ? $.datepicker.formatDate('yy.mm.dd.', d)+':' : (i+1)+'. nap:')
				+' '+s
				+($('#biblereg-days').attr('checked')?' ('+distribution[i]+' fejezet)':'')
				+'</li>');
		};
	},
	init:function() { // beállítás
		$.ajax({ // az alap Biblia beolvasása
			type:'GET',
			url:'bible.xml',
			dataType:'xml',
			complete:function(data) {
				bibleReg.set=$.xmlToJSON(data.responseXML).set;
				var i;
				// kezelőfelület aktiávlása
				for (i=0;i<bibleReg.set.length;i++) {
					$('#biblereg-select').append('<option value="'+i+'">'+bibleReg.set[i].name+' – '
						+bibleReg.set[i].decription+' ('+bibleReg.set[i].author+')</option>'
					);
				};
				$('#biblereg-select').change(function () {
					bibleReg.createEditor(bibleReg.set[this.selectedIndex]);
				}).removeAttr('disabled');
				$('#biblereg-button').removeAttr('disabled');
				$('#biblereg-day').removeAttr('disabled');
				bibleReg.createEditor(bibleReg.set[0]);
				bibleReg.create($('#biblereg-day').val()); // első legyártása

			}
		});
		$('#biblereg-startday').val($.datepicker.formatDate('yy.mm.dd.', new Date()))
			.datepicker({dateFormat:'yy.mm.dd.',showAnim:'fadeIn',speed:'fast'});
		$('#biblereg-date').change(function() {
			$('#biblereg-startday').parent().toggle();
		});
	},
	createEditor:function(set) { // a fejezet-sorrend szerkesztő felállítása
		var i,e,p;
		$('#biblereg-editor ol').empty();
		for (i=0; i < set.element.length; i++) {
			e=set.element[i];
			p=bibleReg.set[0].element.indexOf('sortName',e.sortName)+1;
			$('#biblereg-editor ol').append('<li style="height:'+(14+parseInt(e.end-e.start))+'px"'
				+'sortName="'+e.sortName+'" name="'+e.name+'" start="'+e.start+'" end="'+e.end+'"  class="'+e['class']+'">'
				+'<input type="checkbox" checked="checked">'
				+'<strong title="'+e.name+', eredeti sorrendben a '+p+'. könyv, fejezetek: '+e.start+'–'+e.end+'">'+e.sortName+'</strong> '
				+'<em>'+e.start+'–'+e.end+'</em><span>: '+e.name+', '+p+'. könyv</span></li>'
		   );
		};
		$('#biblereg-editor li.disabled input').each(function() {
			this.checked=false;
		});
		$('#biblereg-editor li input').each(function() {
			$(this).change(function() {
				$(this).parent().toggleClass("disabled");
			});
		});
		$('#biblereg-toggle').removeAttr('disabled');
		$("#biblereg-editor ol").sortable({ hoverClass:'biblereg-editor-hover' });
	},
	editor:false, // szerkesztő állapota
	toggleEditor:function() { // fejezet sorrend szerkesztő bekapcsolása-kikapcsolása
		if (this.editor) {
			$('#biblereg-toggle').html($('#biblereg-toggle').html().replace('ki','be'))
				.css({'margin-left':'0px'});
			$('#biblereg-buttons').append($('#biblereg-toggle'));
			$('#biblereg-editor button').hide();
			$('#biblereg-editor').slideUp('normal', function() {
				$('#biblereg-editor button').show();
			});
			this.editor=false;
		} else {
			window.scrollTo(0,$('#biblereg-buttons').offset().top);
			$('#biblereg-editor').css({top:$('#biblereg-buttons').offset().top+'px'});
			$('#biblereg-toggle').html($('#biblereg-toggle').html().replace('be','ki'))
				.css({'margin-left':$('#biblereg-toggle').offset().left+'px'});
			$('#biblereg-editor div').prepend($('#biblereg-toggle'));
			$('#biblereg-buttons').hide();
			$('#biblereg-editor').fadeIn('slow', function() {
				$('#biblereg-buttons').show();
			});
			this.editor=true;
		};
	},
	fragment:false, // tördelés szerkesztő állapota
	toggleFragment:function() { // szerkesztő átváltása (és) visszaváltása tördelő üzemmódra
		if (this.fragment==false) {
			$("#biblereg-editor ol").sortableDestroy().addClass('makeup-editor');
			$('#biblereg-editor li').each(function() {
				$(this).bind('click',bibleReg.setupTarget);
			});
			$('#biblereg-fragment').html($('#biblereg-fragment').html().replace('be','ki'));
			$('#biblereg-select').attr('disabled','disabled');
			$('#biblereg-toggle').attr('disabled','disabled');
			$('#biblereg-save').attr('disabled','disabled');
			this.fragment=true;
		} else {
			$('#biblereg-editor li').each(function() {
				$(this).unbind('click',bibleReg.setupTarget);
			});
			$('#biblereg-editor-controls').hide();
			$("#biblereg-editor ol").sortable({ hoverClass:'biblereg-editor-hover' }).removeClass('makeup-editor');
			$(bibleReg.target).removeClass('target');
			bibleReg.target=null;
			while (bibleReg.related.length>0) $(bibleReg.related.pop()).removeClass('related');
			$('#biblereg-fragment').html($('#biblereg-fragment').html().replace('ki','be'));
			$('#biblereg-select').removeAttr('disabled');
			$('#biblereg-toggle').removeAttr('disabled');
			$('#biblereg-save').removeAttr('disabled');
			this.fragment=false;
		}
	},
	target:null, // tördelés: kiválasztott: széttörés célja
	related:[], // tördelés: a kiválasztotthoz kapcsolódó: összefűzés céljai
	setupTarget:function(e) { // tördelés: tördelő szerkesztő felülete és működése
		var i,s='';
		$('#biblereg-editor-makeup').attr('disabled','disabled');
		$('#biblereg-editor-select').attr('disabled','disabled').empty();
		if (bibleReg.target!=null) $(bibleReg.target).removeClass('target');
		if (parseInt($(this).attr('end'))-parseInt($(this).attr('start'))>0) {
		for (i=parseInt($(this).attr('start'));i<parseInt($(this).attr('end'));) s+='<option value="'+i+'">'+i+' ↔ '+(++i)+'</option>';
		$('#biblereg-editor-select').append(s)
				.attr('selectedIndex',Math.ceil(($('#biblereg-editor-select').children('option').length-1)/2)) // round helyett ceil: lenght=1 esetén
				.removeAttr('disabled');
				$('#biblereg-editor-makeup').removeAttr('disabled');
		}
		$(this).addClass('target');
		bibleReg.target=this;
		$('#biblereg-editor-closeup').attr('disabled','disabled');
		while (bibleReg.related.length>0) $(bibleReg.related.pop()).removeClass('related');
		$('#biblereg-editor li').each(function() {
			if ($(this).attr('sortName')==$(bibleReg.target).attr('sortName')) {
				if (this!=bibleReg.target) {
					$(this).addClass('related');
					bibleReg.related.push(this);
				};
			};
		});
		if (bibleReg.related.length>0) $('#biblereg-editor-closeup').removeAttr('disabled');
		$('#biblereg-editor-controls').show().animate({'left':e.pageX+'px','top':e.pageY+'px'},'slow');
	},
	makeup:function() { // tördelés: széttörés
		var x = [];
		x.push(parseInt($(bibleReg.target).attr('start'))); // a fejezetek eloszlása a széttörés után
		x.push(parseInt($('#biblereg-editor-select').val()));
		x.push(x[1]+1);
		x.push(parseInt($(bibleReg.target).attr('end')));
		$(bibleReg.target).removeClass('target').clone(true) // a meglévő klónozása egy újjá és beállítása
			.attr('start',x[2])
			.children('em').text($(bibleReg.target).children('em').eq(0).text().replace(/\d+–/,x[2]+'–')).end()
			.children('strong').attr('title',$(bibleReg.target).children('strong').eq(0).attr('title').replace(/\d+–/,x[2]+'–')).end()
			.css({'height':14+x[3]-x[2]})
			.addClass('fragment')
			.insertAfter(bibleReg.target);
		$(bibleReg.target) // a régi módosítása
			.attr('end',x[1])
			.children('em').text($(bibleReg.target).children('em').eq(0).text().replace(/–\d+/,'–'+x[1])).end()
			.children('strong').attr('title',$(bibleReg.target).children('strong').eq(0).attr('title').replace(/–\d+/,'–'+x[1])).end()
			.css({'height':14+x[1]-x[0]})
			.addClass('fragment');
		while (bibleReg.related.length>0) $(bibleReg.related.pop()).removeClass('related');
		bibleReg.target=null;
		$('#biblereg-editor-makeup').attr('disabled','disabled');
		$('#biblereg-editor-select').attr('disabled','disabled').empty();
		$('#biblereg-editor-closeup').attr('disabled','disabled');
	},
	closeup:function() { // tördelés: összefűzés
		var x=0,a;
		while (bibleReg.related.length>0) { // az összesből a fejezetek teljes számának kinyerése és törlésük
			a=$(bibleReg.related.pop())
			x=Math.max(x,parseInt(a.attr('end')));
			a.remove();
		};
		x=Math.max(x,parseInt($(bibleReg.target).attr('end')));
		$(bibleReg.target) // a kiválasztott módosítása
			.attr('start',1)
			.attr('end',x)
			.children('em').text($(bibleReg.target).children('em').eq(0).text().replace(/\d+–\d+/,'1–'+x)).end()
			.children('strong').attr('title',$(bibleReg.target).children('strong').eq(0).attr('title').replace(/\d+–\d+/,'1–'+x)).end()
			.css({'height':14+x-1})
			.removeClass('fragment')
			.removeClass('target');
		bibleReg.target=null;
		$('#biblereg-editor-makeup').attr('disabled','disabled');
		$('#biblereg-editor-select').attr('disabled','disabled').empty();
		$('#biblereg-editor-closeup').attr('disabled','disabled');

	},
	saveJson:{},
	saveBook:function() { // saját fejezet-sorrend mentése XML-be
		this.saveJson={'set':{'element':[]}};
		$('#biblereg-editor li').each(function(){
			bibleReg.saveJson.set.element.push({
				'@sortName':$(this).attr('sortName'),
				'@name'	:$(this).attr('name'),
				'@start'   :$(this).attr('start'),
				'@end'	 :$(this).attr('end'),
				'@class'   :this.className
			});
		});
		$('#biblereg-log').val(json2xml(eval(this.saveJson)));
		$('#biblereg-log').show();
	}
};