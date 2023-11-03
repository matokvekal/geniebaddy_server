


const { QueryTypes } = require('sequelize');
// const { getFixedValue } = require('../utils/getFixedValues');

const checkEntityPermision= async(user_role_object, tableName,sequelize) =>{
    try {
     // return 2;
     let user_role=0;
     const SQL= `SELECT distinct permission FROM user_role_mapping_tables WHERE  table_name='${tableName}' and is_active=1 `
      let permissions = await sequelize.query(SQL
       ,
        { type: QueryTypes.SELECT }
      );
      
      if(permissions &&permissions.length>0){
        let access=0;
        for(const row of permissions){
            access=user_role_object[row.permission]
            user_role=Number(access)>Number(user_role)?Number(access):user_role;
        }
        return user_role;
      }else{
        return false
      }
      
    } catch (e) {
      console.log("checkEntityPermision",e)
    }
  };

export default checkEntityPermision;
