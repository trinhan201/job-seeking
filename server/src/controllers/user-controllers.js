import Catgory from '../models/Category.js';
import Job from '../models/Job.js';
import Company from '../models/Company.js';
import Resume from '../models/Resume.js';
import Notification from '../models/Notification.js';
import JobSave from '../models/JobSave.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Get all user controller
export const getAllUserController = async (req, res) => {
    try {
        const allUsers = await User.find().sort({ createdAt: -1 });

        const users = allUsers?.filter((item) => item?._id?.toString() !== req.user._id);

        res.status(200).json({ code: 200, message: 'Success', users });
    } catch (error) {
        console.log(error);
        res.status(400).json({ code: 400, message: 'Unexpected error' });
    }
};

// Delete user by id controller
export const deleteUserByIdController = async (req, res) => {
    try {
        const userId = req.params.userId;

        await Resume.findOneAndDelete({ userId });
        await Company.findOneAndDelete({ userId });
        await JobSave.findOneAndDelete({ userId });
        await User.findOneAndDelete({ _id: userId });

        res.status(200).json({ code: 200, message: 'Xóa người dùng thành công' });
    } catch (error) {
        console.log(error);
        res.status(400).json({ code: 400, message: 'Unexpected error' });
    }
};

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

// Change avatar controller
export const changeAvatarController = async (req, res) => {
    try {
        const userId = req.user._id;
        const file = req.file;
        const fileUrl = process.env.BASE_URL + `/static/${file.filename}`;
        if (!file) return res.status(200).json({ code: 400, message: 'Hãy chọn 1 ảnh' });

        await User.findOneAndUpdate({ _id: userId }, { avatar: fileUrl });
        res.status(200).json({ code: 200, message: 'Thay đổi ảnh nền thành công', fileName: file.filename });
    } catch (error) {
        res.status(400).json({ code: 400, message: 'Unexpected error' });
        console.log(error);
    }
};

// Change user appearance controller
export const changeAppearanceController = async (req, res) => {
    try {
        const isAppeared = req.body.isAppeared;
        await User.findByIdAndUpdate(req.user._id, { isAppeared });
        res.status(200).json({ code: 200, message: !isAppeared ? 'Đã ẩn hồ sơ' : 'Hồ sơ đã hiển thị' });
    } catch (error) {
        res.status(400).json({ code: 400, message: 'Unexpected error' });
        console.log(error);
    }
};

// Change user seeking status controller
export const changeSeekingStatusController = async (req, res) => {
    try {
        const isSeeking = req.body.isSeeking;
        await User.findByIdAndUpdate(req.user._id, { isSeeking });
        res.status(200).json({ code: 200, message: isSeeking ? 'Đã bật tìm việc' : 'Đã tắt tìm việc' });
    } catch (error) {
        res.status(400).json({ code: 400, message: 'Unexpected error' });
        console.log(error);
    }
};

// Get employer dashboard controller
export const getEmployerDashboardController = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user._id });

        const jobsCount = await Job.find({ companyId: company._id });
        const candidatesCount = jobsCount?.reduce((total, currentValue) => {
            return total + currentValue?.jobApplicants?.length;
        }, 0);

        const recommendCVs = await Promise.all(
            jobsCount
                ?.filter((j) => j?.jobStatus === 'Đang tuyển')
                ?.map(async (item) => {
                    let resumes = await Resume.find({
                        skills: { $in: item?.jobSkills },
                        experience: item?.jobExp,
                    });
                    resumes = resumes?.filter((item) => item?.userId?.toString() !== req.user._id);
                    return resumes;
                }),
        );
        const recommendCVsCount = recommendCVs?.reduce((total, item) => {
            return total + item?.length;
        }, 0);

        const notisCount = await Notification.find({ receiverId: req.user._id }).sort({ createdAt: -1 });

        res.status(200).json({
            code: 200,
            message: 'Success',
            jobsCount,
            candidatesCount,
            recommendCVsCount,
            notisCount,
        });
    } catch (error) {
        res.status(400).json({ code: 400, message: 'Unexpected error' });
        console.log(error);
    }
};

// Get candidate chart data controller
export const getCandidateChartDataController = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user._id });

        const jobsCount = await Job.find({ companyId: company._id });

        const allApplicants = jobsCount?.reduce((total, item) => {
            return total?.concat(item?.jobApplicants);
        }, []);

        const getMonth = (num) => {
            const d = new Date(num);
            return d.getMonth();
        };

        const getYear = (num) => {
            const d = new Date(num);
            return d.getFullYear();
        };

        const janApp = allApplicants?.filter(
            (item) => getMonth(item?.appliedTime) === 0 && getYear(item?.appliedTime) === Number(req.query.year),
        );
        const febApp = allApplicants?.filter(
            (item) => getMonth(item?.appliedTime) === 1 && getYear(item?.appliedTime) === Number(req.query.year),
        );
        const marApp = allApplicants?.filter(
            (item) => getMonth(item?.appliedTime) === 2 && getYear(item?.appliedTime) === Number(req.query.year),
        );
        const aprApp = allApplicants?.filter(
            (item) => getMonth(item?.appliedTime) === 3 && getYear(item?.appliedTime) === Number(req.query.year),
        );
        const mayApp = allApplicants?.filter(
            (item) => getMonth(item?.appliedTime) === 4 && getYear(item?.appliedTime) === Number(req.query.year),
        );
        const junApp = allApplicants?.filter(
            (item) => getMonth(item?.appliedTime) === 5 && getYear(item?.appliedTime) === Number(req.query.year),
        );
        const julApp = allApplicants?.filter(
            (item) => getMonth(item?.appliedTime) === 6 && getYear(item?.appliedTime) === Number(req.query.year),
        );
        const augApp = allApplicants?.filter(
            (item) => getMonth(item?.appliedTime) === 7 && getYear(item?.appliedTime) === Number(req.query.year),
        );
        const sepApp = allApplicants?.filter(
            (item) => getMonth(item?.appliedTime) === 8 && getYear(item?.appliedTime) === Number(req.query.year),
        );
        const octApp = allApplicants?.filter(
            (item) => getMonth(item?.appliedTime) === 9 && getYear(item?.appliedTime) === Number(req.query.year),
        );
        const novApp = allApplicants?.filter(
            (item) => getMonth(item?.appliedTime) === 10 && getYear(item?.appliedTime) === Number(req.query.year),
        );
        const devApp = allApplicants?.filter(
            (item) => getMonth(item?.appliedTime) === 11 && getYear(item?.appliedTime) === Number(req.query.year),
        );

        res.status(200).json({
            code: 200,
            message: 'Success',
            data: {
                janApp,
                febApp,
                marApp,
                aprApp,
                mayApp,
                junApp,
                julApp,
                augApp,
                sepApp,
                octApp,
                novApp,
                devApp,
            },
        });
    } catch (error) {
        res.status(400).json({ code: 400, message: 'Unexpected error' });
        console.log(error);
    }
};

// Get admin dashboard controller
export const getAdminDashboardController = async (req, res) => {
    try {
        const employers = await User.countDocuments({ role: 0 });
        const candidates = await User.countDocuments({ role: 1 });
        const jobs = await Job.countDocuments();
        const categories = await Catgory.countDocuments();
        const notifications = await Notification.find({ receiverId: req.user._id }).sort({ createdAt: -1 });

        res.status(200).json({
            code: 200,
            message: 'Success',
            employers,
            candidates,
            jobs,
            categories,
            notifications,
        });
    } catch (error) {
        res.status(400).json({ code: 400, message: 'Unexpected error' });
        console.log(error);
    }
};

// Get candidate chart data controller
export const getJobChartDataController = async (req, res) => {
    try {
        const jobs = await Job.find();

        const getMonth = (num) => {
            const d = new Date(num);
            return d.getMonth();
        };

        const getYear = (num) => {
            const d = new Date(num);
            return d.getFullYear();
        };

        const janJobs = jobs?.filter(
            (item) => getMonth(item?.createdAt) === 0 && getYear(item?.createdAt) === Number(req.query.year),
        );
        const febJobs = jobs?.filter(
            (item) => getMonth(item?.createdAt) === 1 && getYear(item?.createdAt) === Number(req.query.year),
        );
        const marJobs = jobs?.filter(
            (item) => getMonth(item?.createdAt) === 2 && getYear(item?.createdAt) === Number(req.query.year),
        );
        const aprJobs = jobs?.filter(
            (item) => getMonth(item?.createdAt) === 3 && getYear(item?.createdAt) === Number(req.query.year),
        );
        const mayJobs = jobs?.filter(
            (item) => getMonth(item?.createdAt) === 4 && getYear(item?.createdAt) === Number(req.query.year),
        );
        const junJobs = jobs?.filter(
            (item) => getMonth(item?.createdAt) === 5 && getYear(item?.createdAt) === Number(req.query.year),
        );
        const julJobs = jobs?.filter(
            (item) => getMonth(item?.createdAt) === 6 && getYear(item?.createdAt) === Number(req.query.year),
        );
        const augJobs = jobs?.filter(
            (item) => getMonth(item?.createdAt) === 7 && getYear(item?.createdAt) === Number(req.query.year),
        );
        const sepJobs = jobs?.filter(
            (item) => getMonth(item?.createdAt) === 8 && getYear(item?.createdAt) === Number(req.query.year),
        );
        const octJobs = jobs?.filter(
            (item) => getMonth(item?.createdAt) === 9 && getYear(item?.createdAt) === Number(req.query.year),
        );
        const novJobs = jobs?.filter(
            (item) => getMonth(item?.createdAt) === 10 && getYear(item?.createdAt) === Number(req.query.year),
        );
        const devJobs = jobs?.filter(
            (item) => getMonth(item?.createdAt) === 11 && getYear(item?.createdAt) === Number(req.query.year),
        );

        res.status(200).json({
            code: 200,
            message: 'Success',
            data: {
                janJobs,
                febJobs,
                marJobs,
                aprJobs,
                mayJobs,
                junJobs,
                julJobs,
                augJobs,
                sepJobs,
                octJobs,
                novJobs,
                devJobs,
            },
        });
    } catch (error) {
        res.status(400).json({ code: 400, message: 'Unexpected error' });
        console.log(error);
    }
};
