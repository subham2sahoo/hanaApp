using app.interactions from '../db/interactions';

service CatalogService {

    entity Employee as projection on interactions.Employee;
    function srv(FLAG : String) returns String;

}
