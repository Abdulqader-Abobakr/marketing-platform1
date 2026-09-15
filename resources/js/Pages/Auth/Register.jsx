import React, { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';

// Separate validation logic
const validateStep = (step, formData, accountType) => {
    const errors = {};

    switch (step) {
        case 1:
            if (accountType === 'freelancer') {
                if (!formData.name.trim()) {
                    errors.name = 'الاسم مطلوب';
                } else if (!/^[\u0621-\u064A\s]+$/.test(formData.name.trim())) {
                    errors.name = 'الاسم يجب أن يحتوي على أحرف عربية فقط';
                }
            } else if (!formData.companyName.trim()) {
                errors.companyName = 'اسم الشركة مطلوب';
            } else if (!/^[\u0621-\u064A\s]+$/.test(formData.companyName.trim())) {
                errors.companyName = 'اسم الشركة يجب أن يحتوي على أحرف عربية فقط';
            }

            if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                errors.email = 'البريد الإلكتروني غير صحيح';
            }

            if (!formData.phone) {
                errors.phone = 'رقم الهاتف مطلوب';
            } else if (!/^7\d{8}$/.test(formData.phone.replace(/[\s\-\(\)\+]/g, ''))) {
                errors.phone = 'رقم الهاتف يجب أن يبدأ بـ 7 ويتكون من 9 أرقام';
            }
            break;

        case 2:
            if (!formData.sector) errors.sector = 'القطاع مطلوب';
            if (accountType === 'freelancer' && formData.sector === 'custom' && !formData.customSector.trim()) {
                errors.customSector = 'يرجى إدخال المجال';
            }

            if (!formData.country.trim()) {
                errors.country = 'الدولة مطلوبة';
            } else if (!/^[\u0621-\u064A\s]+$/.test(formData.country.trim())) {
                errors.country = 'الدولة يجب أن تحتوي على أحرف عربية فقط';
            }

            if (!formData.city.trim()) {
                errors.city = 'المدينة مطلوبة';
            } else if (!/^[\u0621-\u064A\s]+$/.test(formData.city.trim())) {
                errors.city = 'المدينة يجب أن تحتوي على أحرف عربية فقط';
            }
            break;

        case 3:
            if (formData.password.length < 8) {
                errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
            } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(formData.password)) {
                errors.password = 'كلمة المرور يجب أن تحتوي على حروف صغيرة وكبيرة وأرقام ورموز';
            }

            if (formData.password !== formData.password_confirmation) {
                errors.password_confirmation = 'كلمتا المرور غير متطابقتين';
            }
            break;
    }

    return errors;
};

// Separate account type options
const ACCOUNT_TYPES = {
    freelancer: {
        id: 'freelancer',
        label: 'مستقل في خدمات ريادة الأعمال',
        description: 'أنشئ حساباً مستقلاً لتقديم خدمات ريادة الأعمال للشركات',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
        ),
        color: 'bg-[#ff7a45]'
    },
    company: {
        id: 'company',
        label: 'شركة / مؤسسة',
        description: 'أنشئ حساب شركة للبحث عن المستقلين لتنفيذ مشاريعك',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V11H3v8a2 2 0 002 2z" />
            </svg>
        ),
        color: 'bg-[#6b46ff]'
    }
};

// Separate form field configurations
const FORM_FIELDS = {
    company: {
        1: [
            { name: 'companyName', label: 'اسم الشركة', type: 'text', placeholder: 'أدخل اسم شركتك', required: true },
            { name: 'email', label: 'البريد الإلكتروني', type: 'email', placeholder: 'example@company.com', required: true },
            { name: 'phone', label: 'رقم الهاتف', type: 'tel', placeholder: '7xxxxxxxx', required: true },
            { name: 'idDocument', label: 'صورة السجل التجاري', type: 'file', required: true }
        ],
        2: [
            { name: 'sector', label: 'القطاع / المجال', type: 'select', placeholder: 'اختر المجال', required: true },
            { name: 'country', label: 'الدولة', type: 'text', placeholder: 'اليمن', required: true },
            { name: 'city', label: 'المدينة', type: 'text', placeholder: 'صنعاء، عدن، تعز..', required: true }
        ],
        3: [
            { name: 'password', label: 'كلمة المرور', type: 'password', placeholder: 'أدخل كلمة السر', required: true },
            { name: 'password_confirmation', label: 'تأكيد كلمة المرور', type: 'password', placeholder: 'أعد إدخال كلمة السر', required: true }
        ]
    },
    freelancer: {
        1: [
            { name: 'name', label: 'الاسم', type: 'text', placeholder: 'أدخل اسمك', required: true },
            { name: 'email', label: 'البريد الإلكتروني', type: 'email', placeholder: 'example@company.com', required: true },
            { name: 'phone', label: 'رقم الهاتف', type: 'tel', placeholder: '7xxxxxxxx', required: true },
            { name: 'idDocument', label: 'صورة الهوية / جواز السفر', type: 'file', required: true }
        ],
        2: [
            { name: 'sector', label: 'مجال ريادة الأعمال الذي تقدّم فيه الخدمة', type: 'select', placeholder: 'اختر المجال', required: true, options: ['خدمات التسويق', 'التصميم الجرافيكي والهوية البصرية', 'تطوير المواقع وتطبيقات الجوال', 'إدارة وسائل التواصل الاجتماعي', 'الاستشارات التجارية', 'أبحاث السوق', 'إعداد خطط الأعمال'] },
            { name: 'country', label: 'الدولة', type: 'text', placeholder: 'اليمن', required: true },
            { name: 'city', label: 'المدينة', type: 'text', placeholder: 'صنعاء، عدن، تعز..', required: true }
        ],
        3: [
            { name: 'password', label: 'كلمة المرور', type: 'password', placeholder: 'أدخل كلمة السر', required: true },
            { name: 'password_confirmation', label: 'تأكيد كلمة المرور', type: 'password', placeholder: 'أعد إدخال كلمة السر', required: true }
        ]
    }
};

// Form input component
const FormInput = ({ field, value, onChange, error }) => {
    const commonProps = {
        name: field.name,
        value: value || '',
        onChange,
        placeholder: field.placeholder,
        required: field.required,
        className: `w-full rounded-xl border ${error ? 'border-red-500' : 'border-slate-200'} bg-slate-50 px-4 py-3.5 text-right text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors`
    };

    if (field.type === 'select') {
        const options = field.options || ['التسويق الرقمي', 'العلامة التجارية', 'التصميم والإبداع', 'تطوير المواقع'];
        return (
            <div>
                <label className="block text-sm md:text-base font-medium text-slate-700 mb-1 text-right">
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                </label>
                <select {...commonProps}>
                    <option value="">اختر المجال</option>
                    {options.map(option => (
                        <option key={option} value={option === 'اكتب يدويًا' ? 'custom' : option}>{option}</option>
                    ))}
                </select>
                {error && <p className="mt-1 text-sm text-red-500 text-right">{error}</p>}
            </div>
        );
    }

    if (field.type === 'file') {
        return (
            <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5 text-right">
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                </label>
                <input
                    name={field.name}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={onChange}
                    className={`w-full rounded-xl border ${error ? 'border-red-500' : 'border-slate-200'} bg-slate-50 px-4 py-3.5 text-right text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors`}
                />
                {value && value.name && <p className="mt-1 text-sm text-slate-700 text-right">{value.name}</p>}
                {error && <p className="mt-0.5 text-xs text-red-500 text-right">{error}</p>}
            </div>
        );
    }

    return (
        <div>
            <label className="block text-xs font-medium text-slate-700 mb-0.5 text-right">
                {field.label}
                {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            <input type={field.type} {...commonProps} />
            {error && <p className="mt-0.5 text-xs text-red-500 text-right">{error}</p>}
        </div>
    );
};

// Step indicator component
const StepIndicator = ({ step, stepData }) => {
    return (
        <div className="flex justify-between gap-2 text-center">
            {stepData.map((item, index) => {
                const currentStep = index + 1;
                const isActive = currentStep === step;
                const isDone = currentStep < step;

                return (
                    <div key={item.label} className="flex-1">
                        <div
                            className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${isActive
                                ? 'border-primary bg-primary text-white'
                                : isDone
                                    ? 'border-primary bg-primary-light text-primary'
                                    : 'border-slate-300 bg-white text-slate-400'
                                }`}
                        >
                            {isDone ? '✓' : currentStep}
                        </div>
                        <div className={`text-[10px] font-semibold ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                            {item.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

function Register() {
    const [step, setStep] = useState(0);
    const [accountType, setAccountType] = useState('');

    const { data, setData, post, processing, errors: serverErrors, clearErrors } = useForm({
        companyName: '',
        name: '',
        email: '',
        phone: '',
        sector: '',
        customSector: '',
        idDocument: null,
        country: '',
        city: '',
        password: '',
        password_confirmation: '',
        role: '',
    });

    const [errors, setErrors] = useState({});

    const stepData = [
        { label: 'الحساب', description: 'أدخل بياناتك الأساسية' },
        { label: 'المعلومات', description: 'أضف معلومات الشركة' },
        { label: 'كلمة المرور', description: 'إنشئ كلمة مرور قوية' },
    ];

    const handleChange = (e) => {
        const { name, type, value, files } = e.target;
        const newValue = type === 'file' ? (files && files[0]) : value;
        setData(name, newValue);
        clearErrors(name);
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleNext = (e) => {
        e.preventDefault();

        const newErrors = validateStep(step, data, accountType);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const firstErrorField = document.querySelector(`[name="${Object.keys(newErrors)[0]}"]`);
            if (firstErrorField) firstErrorField.focus();
            return;
        }

        if (step < 3) {
            setStep(step + 1);
            return;
        }

        post('/register', {
            forceFormData: true,
            onError: (formErrors) => {
                setErrors(formErrors);

                const fieldNames = Object.keys(formErrors);
                if (fieldNames.some((field) => ['name', 'companyName', 'email', 'phone', 'idDocument'].includes(field))) {
                    setStep(1);
                } else if (fieldNames.some((field) => ['sector', 'country', 'city'].includes(field))) {
                    setStep(2);
                } else {
                    setStep(3);
                }
            },
        });
    };

    const handleBack = () => {
        if (step <= 0) {
            return;
        }
        setStep(step - 1);
    };

    const renderStepContent = () => {
        if (step === 0) {
            return (
                <div className="flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl p-8 border border-slate-100 min-h-100">
                        <div className="flex flex-col items-center gap-2">
                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-dark text-white shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.642 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900">إنشاء حساب جديد</h2>
                            <p className="mt-1 text-sm text-slate-500">اختر نوع الحساب المناسب لك</p>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                {Object.values(ACCOUNT_TYPES).map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => {
                                            setAccountType(type.id);
                                            setData('role', type.id);
                                            setStep(1);
                                        }}
                                        className="flex flex-col items-start gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 p-4 text-right shadow hover:shadow-lg transition-all hover:scale-[1.02] hover:border-primary group"
                                    >
                                        <div className="flex items-center gap-4 w-full">
                                            <div className={`h-12 w-12 rounded-lg ${type.color} flex items-center justify-center text-white shadow transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                                {type.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-base text-slate-900">{type.label}</div>
                                                <div className="text-sm text-slate-500 leading-relaxed">{type.description}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 text-center text-xs text-slate-500">
                                لديك حساب بالفعل؟{' '}
                                <Link href="/login" className="text-primary font-semibold hover:underline transition">
                                    تسجيل الدخول
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        const currentFields = (FORM_FIELDS[accountType] || FORM_FIELDS.company)[step] || [];
        const showCustomSectorInput = accountType === 'freelancer' && step === 2 && data.sector === 'custom';

        return (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-5xl mx-auto overflow-hidden min-h-100">
                <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8">
                    <div className="text-center mb-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                            {accountType === 'freelancer' ? 'مستقل في خدمات ريادة الأعمال' : 'شركة / مؤسسة'}
                        </p>
                        <h1 className="mt-3 text-2xl font-bold text-slate-900">{stepData[step - 1].label}</h1>
                        <p className="mt-2 text-base text-slate-500">{stepData[step - 1].description}</p>
                    </div>

                    <div className="mb-5">
                        <StepIndicator step={step} stepData={stepData} />
                    </div>

                    <form onSubmit={handleNext} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentFields.map((field, index) => {
                            const shouldSpanFullWidth = currentFields.length === 3 && index === 0;

                            return (
                                <div key={field.name} className={shouldSpanFullWidth ? 'md:col-span-2' : ''}>
                                    <FormInput
                                        field={field}
                                        value={data[field.name]}
                                        onChange={handleChange}
                                        error={errors[field.name] || serverErrors[field.name]}
                                    />

                                    {showCustomSectorInput && field.name === 'sector' && (
                                        <div className="mt-2">
                                            <label className="block text-xs font-medium text-slate-700 mb-0.5 text-right">
                                                أدخل المجال
                                                <span className="text-red-500 mr-1">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="customSector"
                                                value={data.customSector || ''}
                                                onChange={handleChange}
                                                placeholder="اكتب المجال الذي تقدّم فيه الخدمة"
                                                className="w-full rounded-xl border bg-slate-50 px-4 py-3.5 text-right text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors"
                                            />
                                            {errors.customSector && <p className="mt-0.5 text-xs text-red-500 text-right">{errors.customSector}</p>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div className="md:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:scale-[1.02]"
                                >
                                    رجوع
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary-dark hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        جاري المعالجة...
                                    </span>
                                ) : (
                                    step < 3 ? 'التالي' : 'إنشاء الحساب'
                                )}
                            </button>
                        </div>
                    </form>

                    <p className="mt-3 text-center text-xs text-slate-500">
                        لديك حساب بالفعل؟{' '}
                        <Link href="/login" className="text-primary hover:underline font-semibold transition">
                            تسجيل الدخول
                        </Link>
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 flex items-center justify-center" dir="rtl">
            <div className="w-full max-w-7xl px-4 sm:px-6 py-4 sm:py-8">
                <div className="mb-4 flex justify-start">
                    <Link
                        href="/"
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all bg-primary text-white shadow hover:bg-primary-dark hover:shadow-lg hover:scale-[1.02]"
                    >
                        <span className="text-base">←</span>
                        العودة
                    </Link>
                </div>

                {renderStepContent()}
            </div>
        </div>
    );
}

export default Register;