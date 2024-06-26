'use client';

import { useState, useEffect, useRef } from 'react';
import FormData from 'form-data';
import { fullNameValidator, dropListValidator, numberValidatorFrom, numberValidatorTo } from '@/utils/formValidation';
import axios from 'axios';
import dynamic from 'next/dynamic';
const JoditEditor = dynamic(() => import('jodit-react'), {
    ssr: false,
});
import Loading from '@/components/common/loading';
import { success, error } from '@/utils/toastMessage';

const CompanyInfomationForm = () => {
    const [careers, setCareers] = useState([]);
    const [companyPhone, setCompanyPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyCareer, setCompanyCareer] = useState('');
    const [companyCareerErrMsg, setCompanyCareerErrMsg] = useState({});
    const [isCompanyCareerErr, setIsCompanyCareerErr] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [companyNameErrMsg, setCompanyNameErrMsg] = useState({});
    const [isCompanyNameErr, setIsCompanyNameErr] = useState(false);

    const [companySizeFrom, setCompanySizeFrom] = useState(Number);
    const [companySizeFromErrMsg, setCompanySizeFromErrMsg] = useState({});
    const [isCompanySizeFromErr, setIsCompanySizeFromErr] = useState(false);
    const [companySizeTo, setCompanySizeTo] = useState(Number);
    const [companySizeToErrMsg, setCompanySizeToErrMsg] = useState({});
    const [isCompanySizeToErr, setIsCompanySizeToErr] = useState(false);

    const [position, setPosition] = useState('');
    const [positionErrMsg, setPositionErrMsg] = useState({});
    const [isPositionErr, setIsPositionErr] = useState(false);
    const [allProvinces, setAllProvinces] = useState([]);
    const [province, setProvince] = useState('');
    const [provinceErrMsg, setProvinceErrMsg] = useState({});
    const [isProvinceErr, setIsProvinceErr] = useState(false);
    const [allDistricts, setAllDistricts] = useState([]);
    const [district, setDistrict] = useState('');
    const [introduction, setIntroduction] = useState('');
    const [avatar, setAvatar] = useState('');
    const [reRender, setReRender] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const ref = useRef();

    const handleUpdateInfo = async () => {
        const isCompanyNameValid = fullNameValidator(companyName, setIsCompanyNameErr, setCompanyNameErrMsg);
        const isCompanyCareerValid = fullNameValidator(companyCareer, setIsCompanyCareerErr, setCompanyCareerErrMsg);
        const isCompanySizeFromValid = numberValidatorFrom(
            companySizeFrom,
            setIsCompanySizeFromErr,
            setCompanySizeFromErrMsg,
        );
        const isCompanySizeToValid = numberValidatorTo(
            companySizeTo,
            companySizeFrom,
            setIsCompanySizeToErr,
            setCompanySizeToErrMsg,
        );
        const isPositionValid = dropListValidator(position, setIsPositionErr, setPositionErrMsg);
        const isProvinceValid = dropListValidator(province, setIsProvinceErr, setProvinceErrMsg);

        if (
            !isCompanyNameValid ||
            !isCompanyCareerValid ||
            !isCompanySizeFromValid ||
            !isCompanySizeToValid ||
            !isPositionValid ||
            !isProvinceValid
        )
            return;

        setIsLoading(true);
        const jsonObject = new Function('return ' + province)();

        const data = {
            companyName,
            companyEmail,
            companyPhone,
            companyCareer,
            companySize: { from: companySizeFrom, to: companySizeTo },
            position,
            companyAddress: { district, jsonObject },
            introduction,
            website,
        };
        const res = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/company/update`, data, {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (res?.data?.code === 200) {
            setIsLoading(false);
            setReRender(!reRender);
            return success(res?.data?.message);
        } else {
            setIsLoading(false);
            return error(res?.data?.message);
        }
    };

    const handleChangeAvatar = async (e) => {
        const data = new FormData();
        const file = e.target.files[0];
        data.append('companyAvatar', file);
        if (!file) return;
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/company/change-avatar`, data, {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (res?.data?.code === 200) {
            setReRender(!reRender);
            ref.current.value = '';
            return success(res?.data?.message);
        } else {
            return error(res?.data?.message);
        }
    };

    useEffect(() => {
        const fetchCategory = async () => {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/category/get-all?page=1&limit=9999`);
            if (res?.data?.code === 200) {
                return setCareers(res?.data?.categories);
            } else {
                return;
            }
        };
        fetchCategory();
    }, []);

    useEffect(() => {
        const fetchProvinces = async () => {
            const res = await axios.get('https://esgoo.net/api-tinhthanh/1/0.htm');
            setAllProvinces(res?.data?.data);
        };
        fetchProvinces();
    }, []);

    useEffect(() => {
        const fetchDistricts = async () => {
            const jsonObject = new Function('return ' + province)();

            const provinceId = jsonObject?.id;
            const res = await axios.get(`https://esgoo.net/api-tinhthanh/2/${provinceId}.htm`);
            setAllDistricts(res?.data?.data);
        };
        fetchDistricts();
    }, [province]);

    useEffect(() => {
        const fetchCompany = async () => {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/company/get-by-employer`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
            });

            if (res?.data?.code === 200) {
                setCompanyName(res?.data?.company?.companyName);
                setWebsite(res?.data?.company?.website);
                setCompanySizeFrom(res?.data?.company?.companySize?.from);
                setCompanySizeTo(res?.data?.company?.companySize?.to);
                setPosition(res?.data?.company?.position);
                setProvince(JSON.stringify(res?.data?.company?.companyAddress?.jsonObject));
                setDistrict(res?.data?.company?.companyAddress?.district);
                setIntroduction(res?.data?.company?.introduction);
                setAvatar(res?.data?.company?.avatar);
                setCompanyCareer(res?.data?.company?.companyCareer);
                setCompanyEmail(res?.data?.company?.companyEmail);
                setCompanyPhone(res?.data?.company?.companyPhone);

                return;
            } else {
                return;
            }
        };
        fetchCompany();
    }, [reRender]);

    return (
        <div className="p-7">
            <h2 className="pl-4 border-l-4 border-red-600 font-semibold text-[1.8rem]">Thông tin công ty</h2>
            <div className="grid grid-cols-2 gap-5 mt-10">
                <div className="flex items-center gap-5">
                    <div className="w-[45px] h-[45px] border border-black rounded-full">
                        <img src={avatar} alt="user avatar" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div>
                        <input
                            ref={ref}
                            type="file"
                            name="companyAvatar"
                            id="companyAvatar"
                            class="inputfile"
                            onChange={(e) => handleChangeAvatar(e)}
                        />
                        <label for="companyAvatar" className="font-medium text-[1.5rem] cursor-pointer hover:underline">
                            Đổi avatar
                        </label>
                    </div>
                </div>
            </div>
            <div className="space-y-4 mt-5">
                <label className="font-semibold text-[1.5rem]">
                    Tên công ty<span className="text-[1.8rem] text-red-600">*</span>
                </label>
                <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onBlur={() => fullNameValidator(companyName, setIsCompanyNameErr, setCompanyNameErrMsg)}
                    placeholder="Công ty TNHH ABC"
                    className={`block w-full text-[1.5rem] outline-[var(--primary-color)] border px-5 py-3 rounded-lg ${
                        isCompanyNameErr ? 'border-red-600' : ''
                    }`}
                />
                <p className="text-red-600 text-[1.3rem]">{companyNameErrMsg.companyName}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div className="space-y-4">
                    <label className="font-semibold text-[1.5rem]">Email</label>
                    <input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="block w-full text-[1.5rem] outline-[var(--primary-color)] border px-5 py-3 rounded-lg"
                    />
                </div>
                <div className="space-y-4">
                    <label className="font-semibold text-[1.5rem]">Số điện thoại</label>
                    <input
                        type="text"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="0123456789"
                        className="block w-full text-[1.5rem] outline-[var(--primary-color)] border px-5 py-3 rounded-lg"
                    />
                </div>
            </div>
            <div className="space-y-4 mt-5">
                <label className="font-semibold text-[1.5rem]">Website</label>
                <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.companyname.com"
                    className="block w-full text-[1.5rem] outline-[var(--primary-color)] border px-5 py-3 rounded-lg"
                />
            </div>
            <div className="space-y-4 mt-5">
                <label className="font-semibold text-[1.5rem]">
                    Ngành nghề<span className="text-[1.8rem] text-red-600">*</span>
                </label>
                <select
                    value={companyCareer}
                    onChange={(e) => setCompanyCareer(e.target.value)}
                    onBlur={() => dropListValidator(companyCareer, setIsCompanyCareerErr, setCompanyCareerErrMsg)}
                    className={`block w-full text-[1.5rem] outline-[var(--primary-color)] border px-5 py-3 rounded-lg ${
                        isCompanyCareerErr ? 'border-red-600' : ''
                    }`}
                >
                    <option value="">-- Ngành/nghề --</option>
                    {careers?.map((c, index) => {
                        return (
                            <option key={index} value={c?.category}>
                                {c?.category}
                            </option>
                        );
                    })}
                </select>
                <p className="text-red-600 text-[1.3rem]">{companyCareerErrMsg.jobCareer}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div className="space-y-4">
                    <label className="font-semibold text-[1.5rem]">
                        Quy mô<span className="text-[1.8rem] text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <input
                                type="number"
                                value={companySizeFrom}
                                onChange={(e) => setCompanySizeFrom(e.target.value)}
                                onBlur={() =>
                                    numberValidatorFrom(
                                        companySizeFrom,
                                        setIsCompanySizeFromErr,
                                        setCompanySizeFromErrMsg,
                                    )
                                }
                                placeholder="1-9999"
                                className={`block w-full text-[1.5rem] outline-[var(--primary-color)] border px-5 py-3 rounded-lg ${
                                    isCompanySizeFromErr ? 'border-red-600' : ''
                                }`}
                            />
                            <p className="text-red-600 text-[1.3rem]">{companySizeFromErrMsg.number}</p>
                        </div>
                        <div>
                            <input
                                type="number"
                                value={companySizeTo}
                                onChange={(e) => setCompanySizeTo(e.target.value)}
                                onBlur={() =>
                                    numberValidatorTo(
                                        companySizeFrom,
                                        companySizeTo,
                                        setIsCompanySizeToErr,
                                        setCompanySizeToErrMsg,
                                    )
                                }
                                placeholder="1-9999"
                                className={`block w-full text-[1.5rem] outline-[var(--primary-color)] border px-5 py-3 rounded-lg ${
                                    isCompanySizeToErr ? 'border-red-600' : ''
                                }`}
                            />
                            <p className="text-red-600 text-[1.3rem]">{companySizeToErrMsg.number}</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <label className="font-semibold text-[1.5rem]">
                        Vị trí công tác<span className="text-[1.8rem] text-red-600">*</span>
                    </label>
                    <select
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        onBlur={() => dropListValidator(position, setIsPositionErr, setPositionErrMsg)}
                        className={`block w-full text-[1.5rem] outline-[var(--primary-color)] border px-5 py-3 rounded-lg ${
                            isPositionErr ? 'border-red-600' : ''
                        }`}
                    >
                        <option value="">-- Chức vụ --</option>
                        <option value="Nhân viên">Nhân viên</option>
                        <option value="Trưởng nhóm">Trưởng nhóm</option>
                        <option value="Trưởng phòng">Trưởng phòng</option>
                        <option value="Phó giám đốc">Phó giám đốc</option>
                        <option value="Giám đốc">Giám đốc</option>
                    </select>
                    <p className="text-red-600 text-[1.3rem]">{positionErrMsg.position}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div className="space-y-4">
                    <label className="font-semibold text-[1.5rem]">
                        Địa điểm làm việc<span className="text-[1.8rem] text-red-600">*</span>
                    </label>
                    <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        onBlur={() => dropListValidator(province, setIsProvinceErr, setProvinceErrMsg)}
                        className={`block w-full text-[1.5rem] outline-[var(--primary-color)] border px-5 py-3 rounded-lg ${
                            isProvinceErr ? 'border-red-600' : ''
                        }`}
                    >
                        <option value="">-- Tỉnh/Thành phố --</option>
                        {allProvinces?.map((p, index) => {
                            return (
                                <option key={index} value={JSON.stringify({ id: p?.id, name: p?.full_name })}>
                                    {p?.full_name}
                                </option>
                            );
                        })}
                    </select>
                    <p className="text-red-600 text-[1.3rem]">{provinceErrMsg.province}</p>
                </div>
                <div className="space-y-4">
                    <label className="block font-semibold text-[1.5rem] pb-0 md:pb-[4px]">Quận/huyện</label>
                    <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className={`block w-full text-[1.5rem] outline-[var(--primary-color)] border px-5 py-3 rounded-lg ${
                            province ? '' : 'pointer-events-none opacity-60'
                        }`}
                    >
                        <option value="">-- Quận/huyện --</option>
                        {allDistricts?.map((d, index) => {
                            return (
                                <option key={index} value={d?.full_name}>
                                    {d?.full_name}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>
            <div className="space-y-4 mt-5">
                <label className="font-semibold text-[1.5rem]">Giới thiệu công ty</label>
                <JoditEditor value={introduction} tabIndex={1} onChange={(newContent) => setIntroduction(newContent)} />
            </div>
            <div className="flex justify-end">
                <button
                    onClick={handleUpdateInfo}
                    className="flex items-center justify-center gap-3 w-fit bg-[var(--primary-color)] text-white font-medium px-16 py-3 mt-7 rounded-lg hover:bg-[var(--primary-hover-color)] transition-all"
                >
                    {isLoading && <Loading />}
                    <span>Lưu</span>
                </button>
            </div>
        </div>
    );
};

export default CompanyInfomationForm;
