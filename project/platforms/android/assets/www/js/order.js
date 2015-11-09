/**
Desarrollo hecho por Jonathan Cardenas :)

**/
(function(){
	var statePlay;
	var currentDateCount;
	var seconds = 0;
	var records;//JSON que tiene las alertas y registros
	var roll = 0;//rollos hechos por el operario en esta orden hija
	
	var messages;//JSON que tiene los mensajes que se van a mostrar
	$(document).on('ready',function(){
		//variables con valor definido ¡¡¡¡¡¡¡¡¡¡¡¡TEMPORALMETE!!!!!!!!!!
		
/*		window.localStorage.setItem("id_user","1143952175");
		window.localStorage.setItem("id_order_child","1");
		window.localStorage.setItem("id_machine","1");
		window.localStorage.setItem("id_proceso","1");//->procesos principal, para el formato de arranque
		window.localStorage.setItem("order","25060");*/

		//variables generadas en el documento
		statePlay = false;//por defecto colocar en false el estado del cronometro
		
		initStopwatch();//iniciar el timer, debe hacerse la validacion primero si hay una parada en curso	
		getAllTimeBlock();//obtiene todas las paradas segun la maquina donde esta instalada
		requestAnimationFrame(play);

		startEvents();//start eventes listener
		queryDataOrder();//consulta la informacion en la base de datos del khronos
		queryDataUser();//consulta de informacion del usuario
		getRecords(setRecords);//consulta los regitros y despues inserta o setea todos los registros para las alertas
		showMessages();//mustras mensajes en el head del documento
		getAllErrors();//consulta todas las fallas para esta maquina
		queryRoll();//cantidad de rollos
		get_all_type_waste();//obtiene todos los procesos para colocarlos en la lsita de desperdicio
		query_waste();//obtiene los desperdicios
		addFieldsFormStartPrint();//agrega campos al formualrio de arranque en impresion
		
	});
	function initStopwatch(){
		$.ajax({//ppeticion del bloque tiempo en curso
			url:myserver.ip+"get_time_block",
			data:{id_order_child:window.localStorage.getItem("id_order_child")},
			type:"POST",
			dataType:"json",
			success:function(response){
				if(response.state > 0){//la variable state me dice si encontro resultados
					statePlay = true;//cambio el estado a verdadero del cronometro
					var newDateCount = "#dateCountdown"+response.id_time_block;//un nuevo elemento tipo cronometro
					currentDateCount = newDateCount;//actualizo la variable global
					//agrego un nuevo timer
					$("#spaceDateCount").append('<div id="dateCountdown'+response.id_time_block+'" style="width: 100%;"></div>');
					$("#nameTimeBlock").text(response.name_time_block);//nombre de la parada

					window.localStorage.setItem("id_time_block",response.id_time_block);//id del bloque de tiempo abierto

					$(newDateCount).attr("data-date",response.start_date);
					$(newDateCount).TimeCircles({
					    "animation": "smooth",
					    "bg_width": 0.45,
					    "fg_width": 0.04,
					    "circle_bg_color": "white",
					    "time": {
					        "Days": {
					            "text": "Dias",
					            "color": "#C7404D",
					            "show": true
					        },
					        "Hours": {
					            "text": "Horas",
					            "color": "#3AC8C1",
					            "show": true
					        },
					        "Minutes": {
					            "text": "Minutos",
					            "color": "#8B327B",
					            "show": true
					        },
					        "Seconds": {
					            "text": "Segundos",
					            "color": "#037E8C",
					            "show": true
					        }
					    }
					});

				}
				
			}
		});
	}
	function startEvents(){
		$('.item > a').on('click',function(){
		  var parent = $(this).parents('.item');
		  var ul = $(parent).find(".dropdown");
		  if ($(ul).hasClass("active")) {
		    $(this).removeClass("active");
		    $(ul).removeClass("active");
		  } else {
		    $(this).addClass("active");
		    $(ul).addClass("active");
		  }
		});
		$("#btnViewState").on( "click",function(){
			alert(statePlay);
		});
		$("#btnViewIdTimeBlock").on( "click",function(){
			alert(window.localStorage.getItem("id_time_block"));
		});
		
		$("#endTimeBlock").on("click",function(){//boton que termina o empieza un parada
			if(statePlay){
				//terminar la parada en curso
				endTimeBlock();
				$(currentDateCount).TimeCircles().end().fadeOut();
			}else{
				//inicia una nueva parada
				insertTimeBlock();//inserta un bloque de tiempo
				chooseTypeTimeBlock();//despliega el modal para seleccionar el tipo parada
			}
			statePlay = !statePlay;
		});
		$("#runTimeBlock").on("click",function(){//boton arranca la marcha de la maquina
			if(statePlay){
				//terminar la parada en curso
				//endTimeBlock();
				//$(currentDateCount).TimeCircles().end().fadeOut();
			}else{
				//inicia una nueva parada
				insertTimeBlock("2");//inserta un bloque de tiempo
				
			}
			statePlay = !statePlay;
		});
		$('.exitDialog').on('click',function(){
			$(this).parent().parent().css('display','none');//boton cerrar dialodo modal
		});
		$('#btnTempModal').on('click',function(){
			chooseTypeTimeBlock();//despliega el modal que muestra las paradas
		});
		$('.btn-category-timeblock').on('click',function(){
			var idCategoryTimeBlock = $(this).val();
			$('.btn-time-block').each(function(){
				if($(this).hasClass('category-block-'+idCategoryTimeBlock)){
					$(this).css('display','block');
				}else{
					$(this).css('display','none');
				}
			});
			$('#btnBack').css('display','block');//mostrar boton para retroceder
			$('#spaceCategoriesTimeBlock').fadeOut();//ocultar las categorias
			
		});
		$('#btnBack').on('click',function(){
			clearTimeBlock();
		});

		$('#formNewRoll').submit(function(e){
			e.preventDefault();
			$.ajax({
				url:myserver.ip+"insert_new_roll",
				type:"POST",
				data:$('#formNewRoll').serialize() + "&id_order_child="+window.localStorage.getItem("id_order_child"),
				success:function(response){
					roll = response;
					$('#countRoll > i').text(roll);
					$('#modalInsertRoll').foundation('reveal', 'close');
					$('#formNewRoll').trigger('reset');
				}
			});
		});
		$('#formNewError').submit(function(e){
			e.preventDefault();
			$.ajax({
				url:myserver.ip+"insert_new_error",
				type:"POST",
				data:$('#formNewError').serialize() + "&id_order_child="+window.localStorage.getItem("id_order_child"),
				success:function(response){
					roll = response;
					getError();
					$('#modalInsertError').foundation('reveal', 'close');
					$('#formNewError').trigger('reset');
				}
			});
		});
		$('#btnRefreshPage').on('click',function(){
			location.reload();
		});
		$('#btnInsertMaterial').on('click',function(){//boton que inserta a la db el material utilizado
			var material = prompt('Escriba el material que esta utilizando');
			$.ajax({
				url:myserver.ip+"insert_material",
				type:"POST",
				data:{
					material:material,
					id_order_child : window.localStorage.getItem("id_order_child")
				},
				success:function(response){
					console.log(response);
				}
			});

		});
		$('#countRoll').on('click',function(){
			queryRoll();
		});
		$('#btnAddWaste').on('click',function(){
			var kilos = $('#kilosWaste').val();
			if(kilos == ""){
				alert("digita el valor de kilos");
				$('#kilosWaste').focus();
			}else{
				$.ajax({
					url:myserver.ip+"insert_waste",
					type:"POST",
					data:{
						waste:kilos,
						id_order_child:window.localStorage.getItem("id_order_child"),
						id_type_waste:$("#typeWaste").val()
					},
					success:function(response){
						if(response>0){
							$('#formInsertWaste').trigger('reset');
							query_waste();
						}
					}
				});
			}
		});
		$('#btnEndOrder').on('click',function(){
            $.ajax({
                url:myserver.ip+"end_order_child",
                type:"POST",
                dataType:"json",
                data:{
                    id_order_child:window.localStorage.getItem("id_order_child")
                },
                success: function(response){
                    console.log(response);
                    if (response.affected_rows > 0) {//verifica que se actualicen los datos :)

						window.localStorage.setItem("state_order","false");
						window.localStorage.removeItem("id_order_child");
						window.localStorage.removeItem("order");
						window.localStorage.removeItem("id_time_block");
						window.location.href = "dashboard.html";
                    }
                }               
            });
        });
        $('#btnViewIdOrderChild').on('click',function(){
        	alert(window.localStorage.getItem("id_order_child"));
        });

        $('#formProcessStartPrint').submit(function(e){
    		e.preventDefault();
    		$.ajax({
    			url:myserver.ip+"create_process_start",
    			type:"post",
    			data: $('#formProcessStartPrint').serialize() + "&id_order_child="+window.localStorage.getItem("id_order_child"),
    			success: function(response){
    				//console.log(response);
    				if (response > 0 ){
    					$('#modalInsertFormat').foundation('reveal', 'close');
    				} 
    			}
    		});
		});
	}//end function events
	function play(){//funcion que valida si hay un parada y cambia los nombre y otros atributos
		if (statePlay){
			$('#runTimeBlock').css('display','none');

			$("#endTimeBlock > i").addClass('active');
			$('#nameTimeBlock').removeClass('animated infinite flash');
		}else{
			$('#runTimeBlock').css('display','');
			$("#endTimeBlock > i").removeClass('active');
			$('#nameTimeBlock').text("Por favor selecciona un bloque de tiempo");//nombre de la parada
			$('#nameTimeBlock').addClass('animated infinite flash');
			//$("#endTimeBlock").text('Parar');
		}
		requestAnimationFrame(play);
	}
	function insertTimeBlock(idTypeTimeblock){
		idTypeTimeblock || (idTypeTimeblock = "1");//valor por defecto "tiempo sin justa causa"
		$.ajax({
			url:myserver.ip+"insert_time_block",
			type:"POST",
			dataType:"json",
			data:{
				id_order_child:window.localStorage.getItem("id_order_child"),
				id_type_time_block:idTypeTimeblock
		},
			success:function(response){
				console.log(response.state);
				initStopwatch();//inicia un nuevo cronometro
			}
		});
	}
	function endTimeBlock(){
		$.ajax({
			url:myserver.ip+"end_time_block",
			type:"POST",
			data:{id_order_child:window.localStorage.getItem("id_order_child")},
			success:function(response){
				console.log(response);
			}
		});
	}
	function updateTimeBlock(newIdTimeBlock, newNameTimeBlock){
		$.ajax({
			url:myserver.ip+"update_time_block",
			type:"POST",
			data:{
				id_time_block : window.localStorage.getItem("id_time_block"),
				id_type_time_block : newIdTimeBlock
			},
			success:function(response){
				$('#nameTimeBlock').text(newNameTimeBlock);
				console.log(response);
				$('#modalTypeTimeBlock').foundation('reveal', 'close');
			}
		});
		
	}
	function chooseTypeTimeBlock(){//desplegar el modal que muestra las paradas
		$('#modalTypeTimeBlock').foundation('reveal', 'open');
	}
	function getAllTimeBlock(){//obtener las posibles paradas
		/**
		enviar el id_machine
		**/
		$.ajax({
			url:myserver.ip+"get_all_time_block",
			type:"POST",
			//dataType:"json",
			data:{id_machine:window.localStorage.getItem("id_machine")},
			success: function(response){
				var data = jQuery.parseJSON(response);
				var items="";
				for( var i=0; i< data.length; i++){
					items+= '<button id="'+data[i]["id_block"]+'" class="button expand secondary btn-time-block category-block-'+data[i]["id_category_block"]+'">'+data[i]["name_block"]+'</button>';
				}
				$("#modalBodyTypeTimeBlock").append(items);//agregar paradas al modal tipo boton
				$('.btn-time-block').on('click',function(){//agrego el evento para los boton anteriormente creados
					updateTimeBlock(this.id,$(this).text());
					clearTimeBlock();//limpiar el modal
				});

			}
		});
	}
	function clearTimeBlock(){
		//$(this).css('display','none');
		$('.btn-time-block').each(function(){//oculta todos los botnos
			$(this).css('display','none');
		});
		$('#btnBack').hide();//ocultar boton de ir atras
		$('#spaceCategoriesTimeBlock').fadeIn();//hacer aparecer las categorias de paradas
	}
	function getRecords(callback){
		$.ajax({
			url:myserver.ip+"get_all_records",
			type:"POST",
			data:{id_machine:window.localStorage.getItem("id_machine")},
			success:function(response){
				records = jQuery.parseJSON(response);
			}
		});
		callback();
		
	}
	function setRecords(){

			setInterval(function(){
				seconds++;
				for(var i=0;i<records.length;i++){
					var recordSeconds = parseInt(records[i]['segundos']);
					if (seconds/recordSeconds === parseInt(seconds/recordSeconds, 10)){//valida si es entero, si es entero quiere decir que cumplio el tiempo para mostrar la alerta
						console.log(records[i]['registro']);
						if(records[i]['registro'] == "1"){
							var value = prompt(records[i]['mensaje']);//se pide al usuario el valor
							$.ajax({
								url:myserver.ip+"insert_record",
								type:"POST",
								data:{
									id_record:records[i]['id'],
									value:value,
									id_order_child:window.localStorage.getItem("id_order_child")
								}
							});
						}else{
							alert((records[i]['mensaje']));
						}

						//console.log(seconds);
					    //console.log(seconds/recordSeconds);
					}
				}
				//console.log(seconds);
			},1000);
	}
	function queryDataOrder(){
		//informacion del pedido
		$.ajax({
			url:myserver.ip+"query_data_order",
			type:"POST",
			dataType:"json",
			data:{
				order:window.localStorage.getItem("order")
			},
			success:function(response){
				//var dataResult = jQuery.parseJSON(response); //no es necesario
				var table="<table class='table'>";
				jQuery.each(response, function(i, val) {
					table+="<tr><td>"+i+"</td><td>"+val+"</td></tr>";
				});
				$('#boxDataOrder').append(table+="</table>");
			}
		});
	}
	function queryDataUser(){
		$.ajax({
			url:myserver.ip+"query_data_user",
			type:"POST",
			data:{id_user:window.localStorage.getItem("id_user")},
			success:function(response){
				var dataResult = jQuery.parseJSON(response);
				console.log(dataResult);

				var table = '<table class="table">';
				table+='<tr><td>ID</td><td>'+dataResult.id+'</td><td class="title">nombre</td><td>'+dataResult.nombre+'</td></tr>';
				$('#boxDataUser').append(table+="</table>");
				$('#labelNameMachine').text(window.localStorage.getItem("name_machine"));
			}
		});		
	}
	function queryMessages(){
		console.log('consulting new messages');
		$.ajax({
			url:myserver.ip+"query_messages",
			type:"POST",
			success:function(response){
				messages = jQuery.parseJSON(response);
				console.log(messages);
				if(messages.length > 0){
					//primer mensaje 1 sola vez
					$('#textMessage').css('display','block');
					$('#textMessage').text(messages[0]['mensaje']);
					//fin prime mensaje 1 sola vez
				}

			}
		});
		
	}
	function showMessages(){
		console.log('query messages');
		queryMessages();//consulta mensajes

		console.log('init show messages');
		var messageCurrent = 0;//estrablesco la posicion inicial del mensaje
		setInterval(function(){
			var messagesLength = messages.length-1;//se le resta 1 por el tamano del arreglo empieza desde cero
			if (messagesLength>0){
				$('#textMessage').css('display','none');
				setTimeout(function(){//efecto animacion despues de medio segundo
					$('#textMessage').css('display','block');
					$('#textMessage').text(messages[messageCurrent]['mensaje']);	
				},500);
				if (messageCurrent>=messagesLength){
					messageCurrent=0;
				}else{
					messageCurrent++;
				}
			}

		},8000);
		//consulto nuevos mensajes
		setInterval(queryMessages,30000);
	}
	function getAllErrors(){
		$.ajax({
			url:myserver.ip+"get_all_type_errors",
			type:"POST",
			data:{
				id_machine:window.localStorage.getItem("id_machine")
			},
			success:function(response){
				var errors = jQuery.parseJSON(response);
				var items;
				for(var i=0; i < errors.length ; i++){
					items+= '<option value="'+errors[i]['id']+'">'+errors[i]['nombre']+'</option>';
				}
				$('#formNewError select').append(items);
				getError();
			}

		});
	}
	function getError(){
		$.ajax({
			url:myserver.ip+"get_error",
			type:"POST",
			data:{
				id_order_child:window.localStorage.getItem("id_order_child")
			},
			success:function(response){
				var errors = jQuery.parseJSON(response);
				var table;
				if(errors.length > 0){
					for(var i=0; i < errors.length ; i++){
						table+= '<tr id="trError'+errors[i]['id']+'">';
						table+= '<td>'+errors[i]['id']+'</td>';
						table+= '<td>'+errors[i]['nombre']+'</td>';
						table+= '<td>'+errors[i]['fecha_inicial']+'</td>';
						table+= '<td><button class="btn btn-end-error" id="btnEndError'+errors[i]['id']+'">terminar</button></td>';
						table+= '</tr>';
					}
				}else{
					table+= '<tr><td colspan="4">No se encontraron fallas reportadas...</td></tr>';
				}

				$('#tbodyTableErrors').empty();
				$('#tbodyTableErrors').append(table);
				$('.btn-end-error').on('click',function(){//añadir evento al boton que se incluye en la tabla
					var id = this.id;
					id = id.replace('btnEndError','');
					endError(id);
				});
			}
		});
	}
	function endError(idError){
		technical = prompt('Escriba el nombre del tecnico que atendio el caso');
		technical || (technical="NA");
		$.ajax({
			url:myserver.ip+"end_error",
			type:"POST",
			data:{
				id_error:idError,
				name_technical:technical
			},
			success:function(response){
				if (response > 0 ){
					alert("Falla finalizada correctamente...");
					$('#trError'+idError).hide();
				}
			}
		});
	}
	function queryRoll(){
		$.ajax({
			url:myserver.ip+"query_roll",
			type:"POST",
			data:{
				id_order_child:window.localStorage.getItem("id_order_child")
			},
			success:function(response){
				$('#tableInfoRoll').empty();
				var infoRolls = jQuery.parseJSON(response);
				var items;
				$('#countRoll > i').text(infoRolls.length);
				for (var i= 0 ; i < infoRolls.length ; i++ ){
					items+= '<tr>';
					items+= '<td>'+(i+1)+'</td>';
					items+= '<td>'+infoRolls[i]['metros']+'</td>';
					items+= '<td>'+infoRolls[i]['kilos']+'</td>';
					items+= '</tr>';
				}
				$('#tableInfoRoll').append(items);
			}
		});
	}
	function get_all_type_waste(){
		$.ajax({
			url:myserver.ip+"get_all_type_waste",
			type:"POST",
			data:{
				id_machine:window.localStorage.getItem("id_machine")
			},
			success:function(response){
				var type_waste = jQuery.parseJSON(response);
				for (var i = 0; i < type_waste.length; i++) {
					$('#typeWaste').append('<option value="'+type_waste[i]['id']+'">'+type_waste[i]['nombre']+'</option>');
				}
			}
		});
	}
	function query_waste(){
		$.ajax({
			url:myserver.ip+"get_waste",
			type:"POST",
			data:{id_order_child:window.localStorage.getItem("id_order_child")},
			success:function(response){
				$('#tableDataWaste').empty();
				var wastes = jQuery.parseJSON(response);
				var items;
				for (var i = 0; i < wastes.length; i++) {
					items+="<tr>";
					items+="<td>"+wastes[i]['desperdicio_nombre']+"</td>";
					items+="<td>"+wastes[i]['cantidad']+"</td>";
					items+="<td><button id='btnRemoveWaste"+wastes[i]['id']+"' type='button' class='btn-remove-waste button alert'><i class='fa fa-trash-o'></i></button></td>";
					items+="</tr>";
				}
				$('#tableDataWaste').append(items);
				$('.btn-remove-waste').on('click',function(){
					alert();
				});
			}
		});
	}
	function addFieldsFormStartPrint(){
		var questions = [
			'¿Se realizó despeje de área del anterior pedido?',
			'¿El prealistador hizo entrega de la totalidad de los insumos?',
			'¿La máquina se encuentra en condiciones óptimas de operación?',
			'¿Cuenta con el pedido físico?',
			'¿Cuenta con el arte y la carta técnica de la ficha, la cual hace referencia al pedido físico?',
			'¿Se realizó el montaje de los rodillos anilox de acuerdo a lo estipulado en la carta técnica?',
			'¿Se realizó el montaje de tintas de acuerdo a lo estipulado en la carta técnica?',
			'¿Se realizó el montaje de los rodillos portaplancha de acuerdo a lo estipulado en la carta técnica?',
			'¿Las unidades de secado cumplen los parámetros establecidos en la carta técnica?',
			'¿Cuenta con carpeta de carta de color actualizada?',
			'¿Realizó inspección visual de la muestra impresa?',
			'¿Realizó verificación del paralelismo de la muestra impresa?',
			'¿Los textos de la muestra impresa son legibles?',
			'¿Los tonos de la muestra impresa están conformes con la carpeta parámetro de color?',
			'¿La muestra impresa calca sobre el arte?',
			'¿La distancia de impresión es la correcta?',
			'¿Realizó la lectura de código de barras?',
			'¿Realizó la lectura de la reflectancia de la muestra?',
			'¿Se realizó la evaluación de adherencia de tinta según el instructivo INS-AC-004 EVALUACIÓN DE ADHERENCIA DE TINTA ?'

		];
		var fields="";
		for (var i = 0; i < 19; i++) {
				fields+= '<li class="panel" style="min-height: 100px;">';
				fields+= '<label>'+(i+1)+'- '+questions[i]+'</label>';
				fields+= '<div class="">';
				fields+= '<input id="swStart'+i+'" type="checkbox" >';
				fields+= '<label for="swStart'+i+'">NO</label>';
				fields+= '<input id="swStartApply'+i+'" type="checkbox" class="apply">';
				fields+= '<label for="swStartApply'+i+'">NO APLICA</label>';				
				fields+= '</div>';
				fields+= '<input type="hidden" name="start[]" id="valSwStart'+i+'" value="1">';
				fields+= '<textarea id="textareaStart'+i+'" style="display:none" name="textStart[]"></textarea>';
				fields+= '</li> 	';
		}
		$('#formProcessStartPrint ul').append(fields);

		$('#formProcessStartPrint :checkbox').on('click',function(){

			if($(this).hasClass("apply")){
				var idSwitch= this.id;
				idSwitch = idSwitch.replace("swStartApply","");//get id
				if ($(this).is(':checked')) {
					$('#valSwStart'+idSwitch).val("2");
					$('#swStart'+idSwitch).prop('checked', false);
				}else{
					
				}
				$('#textareaStart'+idSwitch).css('display','none');//oculta las observaciones

			}else{
				var idSwitch= this.id;
				idSwitch = idSwitch.replace("swStart","");
			    if ($(this).is(':checked')) {
		        	$('#textareaStart'+idSwitch).css('display','block');
		        	//$('#textareaStart'+idSwitch).focus();
		        	$('#valSwStart'+idSwitch).val("0");
		        	$('#swStartApply'+idSwitch).prop('checked', false);
			    } else {
			    	$('#textareaStart'+idSwitch).css('display','none');
			    	$('#valSwStart'+idSwitch).val("1");
			    }
			}

        	
        });
	}
	
})();
