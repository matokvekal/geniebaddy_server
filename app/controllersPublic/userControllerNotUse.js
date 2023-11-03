import BaseController from "./baseController";

class UserController extends BaseController {
  // GET /users
  getUser(req, res) {
    let { user_name } = req.query;
    let where = {};
    if (user_name) {
      where.user_name = user_name;
    }

    this.dbModel.findAll(
      {
        where: where,
        attributes: [
          "user_name",
          "user_role",
          "zones",
          "first_name",
          "last_name",
        ]
      }
    )
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        // res.status(500).send({
        //   message: err.message || "Some error occurred while getting user.",
        // });
        res.createErrorLogAndSend({ err: err.message || "Some error occurred while getting user." });
      });
  }


}
export default UserController;
