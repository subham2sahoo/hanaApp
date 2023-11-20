using app.interactions from '../db/interactions';
service CatalogService {

 entity Employee
    as projection on interactions.Employee;

}
