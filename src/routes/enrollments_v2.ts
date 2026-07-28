import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { User, CustomRequest, UserPayload } from "../libs/types.ts";

// import database
import { users,courses,  enrollments, reset_users } from "../db/db.ts";
import { authenticateToken } from "../middlewares/authenMiddleware.ts";
import { check, success } from "zod";
import { fa } from "zod/locales";
import { token } from "morgan";

const router = Router();

// GET /api/v2/users
router.get("/", authenticateToken, (req: CustomRequest, res: Response) => { 
    try {

    const user = req.user
    if(!user){
        return res.status(403).json({
            success : false,
            message: "Unauthorized User (Forbidden)"
        })
    }

    if(user.role == "ADMIN"){
        return res.status(200).json({
      success: true,
      data: enrollments,
    });
    }

    if(user.role == "STUDENT"){
        const courseIds = enrollments.filter((e) => e.studentId === user.studentId).map((e) => e.courseId);

        const result = courses.filter((course) => courseIds.includes(course.courseId)).map((course) => (
            {
                courseId: course.courseId,
                courseTitle: course.courseTitle,
            }
        ));

return res.status(200).json({
  success: true,
  courses: result,
});
    }






    // return all users
 


    // get auth - check - split - check token - payload - check userpayload if admin - 
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

router.post("/",(req: Request , res : Response)=> {
    const {username , password} = req.body;
    const user = users.find((u) => u.username === username && u.password === password);
    if(!user){
    return res.status(401).json({
        success : false,
        message : "Invalid username or password"
    })
  }
    if(user.role === "ADMIN"){
    return res.status(403).json({
        success : false,
        message : "Admin cannot enroll."
    })
  }
});
// POST /api/v2/users/login
router.post("/login", (req: Request, res: Response) => {
  // 1. get username and password from body

  const {username , password} = req.body;
  const user = users.find((u) => u.username === username && u.password === password);
  // 2. check if user exists (search with username & password in DB)  user might be null
  if(!user){
    return res.status(401).json({
        success : false,
        message : "Invalid username or password"
    })
  }

  
  // 3. create JWT token (with user info object as payload) using JWT_SECRET_KEY
  const jwt_fake_secret = "maewsom_is_secret"; // 
  const jwt_secret = process.env.JWT_SECRET || "this_is_secret"
  
  const token = jwt.sign(  // jwt sign user 3 param : payload jwtscret and expires
    {
        username: user.username,
        studentId : user.studentId,
        role : user.role
  },
  jwt_secret,
  {
    expiresIn:"30m"
}
)

  //    (optional: save the token as part of User data)
  user.tokens = user.tokens ? [...user.tokens,token] : [token]

  // 4. send HTTP response with JWT token
  return res.status(200).json({
    success : true,
    message : "login successful",
    token: token
  })

  return res.status(500).json({
    success: false,
    message: "POST /api/v2/users/login has not been implemented yet",
  });
});

// POST /api/v2/users/logout
router.post("/logout",authenticateToken, (req: CustomRequest, res: Response) => {
  // 1. check Request if "authorization" header exists
  //    and container "Bearer ...JWT-Token..."

  // 2. extract the "...JWT-Token..." if available

  // 3. verify token using JWT_SECRET_KEY and get payload (username, studentId and role)

  // 4. check if user exists (search with username)
  const payload_user = req.user;
  const payload_token = req.token;
  const user = users.find((u) => u.username === payload_user?.username );
  if(!user){
    return res.status(404).json({
        success : false ,
        message : "User not found"
    })
  }
  user.tokens = user.tokens?.filter((t) => t ! == payload_token)

  return res.status(200).json({
    success : true,
    message : "log out successfull!"
  })

  // 5. proceed with logout process and return HTTP response
  //    (optional: remove the token from User data)

  return res.status(500).json({
    success: false,
    message: "POST /api/v2/users/logout has not been implemented yet",
  });
});

// POST /api/v2/users/reset
router.post("/reset", (req: Request, res: Response) => {
  try {
    reset_users();
    return res.status(200).json({
      success: true,
      message: "User database has been reset",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

router.delete("/", authenticateToken, (req: CustomRequest, res: Response) => {

    const user = req.user;

    if (!user) {
        return res.status(401).json({
            success: false
        });
    }

    if (user.role === "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Admin cannot delete enrollment."
        });
    }

    const { courseNo } = req.body;

    const index = enrollments.findIndex(
        (e) =>
            e.studentId === user.studentId &&
            e.courseId === courseNo
    );

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: "Enrollment not found"
        });
    }

    enrollments.splice(index, 1);

    return res.status(200).json({
        success: true,
        message: "Enrollment deleted successfully"
    });
});
export default router;