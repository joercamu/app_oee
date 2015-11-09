	config.html
	window.localStorage.getItem("state_config")
#Para poder configuar el servidor, en el archivo config.html hay que especificar el servidor. el resto de la app depende de este archivo
	window.localStorage.setItem("server");
	window.localStorage.setItem("port");
	window.localStorage.setItem("id_machine");
	window.localStorage.setItem("name_machine");
	window.localStorage.setItem("id_process");

	login.html
	window.localStorage.setItem("session","true");
	window.localStorage.setItem("id_shift","1");//->turno
	window.localStorage.setItem("id_user","1143952175");

	new_order.html
	window.localStorage.setItem("id_order_child",response);
	window.localStorage.setItem("order",$('#numberOrder').val());
	window.localStorage.setItem("state_order","true");

	order.html
	window.localStorage.setItem("id_time_block");
	

	/*--Variables que se nececitan en order.html	
		window.localStorage.setItem("id_user","1143952175");
		window.localStorage.setItem("id_order_child","1");
		window.localStorage.setItem("id_machine","1");
		window.localStorage.setItem("id_proceso","1");//->procesos principal, para el formato de arranque
		window.localStorage.setItem("order","25060");
	*/