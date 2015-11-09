//variables con valor definido ¡¡¡¡¡¡¡¡¡¡¡¡TEMPORALMETE!!!!!!!!!!
//window.localStorage.setItem("server","192.168.1.91");
//window.localStorage.setItem("port","80");
var myserver = {
	myhost: "http://"+window.localStorage.getItem("server")+":"+window.localStorage.getItem("port")+"/indicadores-produccion/index.php/apis/",
	get ip(){
		return this.myhost;
	}
};