import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Change password controller
export const changePasswordController = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);
        // Old password from frontend
        const oldPassword = req.body.oldPassword;
        // New password from frontend
        const salt = bcrypt.genSaltSync(10);
        const newPassword = bcrypt.hashSync(req.body.newPassword, salt);
        // Check old password from frontend is the same of password in db
        const isCorrect = await bcrypt.compare(oldPassword, currentUser.password);
        // Check new password conflict with password in db
        const isConflict = await bcrypt.compare(req.body.newPassword, currentUser.password);

        if (!isCorrect) {
            res.status(200).json({
                code: 400,
                message: 'Mật khẩu cũ không chính xác',
            });
        } else {
            if (!isConflict) {
                await User.findByIdAndUpdate({ _id: req.user._id }, { password: newPassword }, { new: true });
                res.status(200).json({
                    code: 200,
                    message: 'Thay đổi mật khẩu thành công',
                });
            } else {
                res.status(200).json({
                    code: 400,
                    message: 'Đây là mật khẩu hiện tại của bạn',
                });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ code: 400, message: 'Unexpected error' });
    }
};

// Update user controller
export const updateUserController = async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user._id,
            { $set: req.body },
            {
                new: true,
            },
        );
        res.status(200).json({ code: 200, message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(400).json({ code: 400, message: 'Unexpected error' });
        console.log(error);
    }
};
