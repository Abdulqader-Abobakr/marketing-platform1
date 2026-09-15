<?php

use Inertia\Inertia;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Freelancer;
use App\Http\Controllers\Company\BriefController;
use App\Http\Controllers\Company\ProfileController;
use App\Http\Controllers\Company\ProposalController as CompanyProposalController;

Route::get('/', function () {
    return Inertia::render('Landing');
})->name('home');

Route::get('/register', [RegisterController::class, 'create'])->name('register');
Route::post('/register', [RegisterController::class, 'store']);

Route::get('/login', [LoginController::class, 'create'])->name('login');
Route::post('/login', [LoginController::class, 'store']);

Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

Route::middleware(['auth', 'role:company'])->group(function () {
    Route::get('/company', [BriefController::class, 'index'])
        ->name('company.dashboard');
    Route::get('/company/profile', [ProfileController::class, 'show'])
        ->name('company.profile');
    Route::put('/company/profile', [ProfileController::class, 'update'])
        ->name('company.profile.update');
    Route::get('/company/settings', [ProfileController::class, 'settings'])
        ->name('company.settings');
    Route::post('/company/briefs', [BriefController::class, 'store'])
        ->name('company.briefs.store');
    Route::put('/company/briefs/{id}', [BriefController::class, 'update'])
        ->name('company.briefs.update');
    Route::delete('/company/briefs/{id}', [BriefController::class, 'destroy'])
        ->name('company.briefs.destroy');
    Route::post('/company/proposals/{id}/accept', [CompanyProposalController::class, 'accept'])
        ->name('company.proposals.accept');
    Route::post('/company/proposals/{id}/deny', [CompanyProposalController::class, 'deny'])
        ->name('company.proposals.deny');
    Route::post('/company/proposals/{id}/chat', [CompanyProposalController::class, 'startChat'])
        ->name('company.proposals.chat');
    Route::post('/company/conversations/{id}/messages', [CompanyProposalController::class, 'sendMessage'])
        ->name('company.conversations.messages');
});

Route::get('/auth/confirm', function () {
    return redirect('/login');
});

/*
|--------------------------------------------------------------------------
| Freelancer Module Routes
|--------------------------------------------------------------------------
*/
Route::prefix('freelancer')
    ->middleware(['auth', 'role:freelancer'])
    ->group(function () {
        Route::get('/', [Freelancer\DashboardController::class, 'index'])->name('freelancer.dashboard');
        Route::get('/proposals', [Freelancer\ProposalController::class, 'index'])->name('freelancer.proposals');
        Route::get('/proposals/{id}/edit', [Freelancer\ProposalController::class, 'edit'])->name('freelancer.proposals.edit');
        Route::put('/proposals/{id}', [Freelancer\ProposalController::class, 'update'])->name('freelancer.proposals.update');
        Route::delete('/proposals/{id}', [Freelancer\ProposalController::class, 'destroy'])->name('freelancer.proposals.destroy');
        Route::get('/proposals/create-for-brief/{briefId}', [Freelancer\ProposalController::class, 'createForBrief'])->name('freelancer.proposals.createForBrief');
        Route::get('/proposals/create/{chatId}', [Freelancer\ProposalController::class, 'create'])->name('freelancer.proposals.create');
        Route::post('/proposals/create/{chatId}', [Freelancer\ProposalController::class, 'store'])->name('freelancer.proposals.store');
        Route::post('/orders/{id}/accept', [Freelancer\ProposalController::class, 'acceptOrder'])->name('freelancer.orders.accept');
        Route::post('/orders/{id}/reject', [Freelancer\ProposalController::class, 'rejectOrder'])->name('freelancer.orders.reject');
        Route::get('/projects', [Freelancer\ProjectController::class, 'index'])->name('freelancer.projects');
        Route::get('/projects/{id}', [Freelancer\ProjectController::class, 'show'])->name('freelancer.projects.show');
        Route::post('/projects/{id}/tasks/{taskId}', [Freelancer\ProjectController::class, 'submitTask'])->name('freelancer.projects.submitTask');
        Route::post('/projects/{id}/deliverables', [Freelancer\ProjectController::class, 'storeDeliverable'])->name('freelancer.projects.deliverables.store');
        Route::get('/services', [Freelancer\ServiceController::class, 'index'])->name('freelancer.services');
        Route::post('/services/portfolio', [Freelancer\ServiceController::class, 'storePortfolio'])->name('freelancer.portfolio.store');
        Route::post('/services/portfolio/{id}', [Freelancer\ServiceController::class, 'updatePortfolio'])->name('freelancer.portfolio.update');
        Route::post('/services/specialties', [Freelancer\ServiceController::class, 'updateSpecialties'])->name('freelancer.specialties.update');
        Route::get('/earnings', [Freelancer\EarningsController::class, 'index'])->name('freelancer.earnings');
        Route::post('/earnings/withdraw', [Freelancer\EarningsController::class, 'withdraw'])->name('freelancer.earnings.withdraw');
        Route::get('/profile', [Freelancer\ProfileController::class, 'show'])->name('freelancer.profile');
        Route::put('/profile', [Freelancer\ProfileController::class, 'update'])->name('freelancer.profile.update');
        Route::get('/settings', [Freelancer\ProfileController::class, 'settings'])->name('freelancer.settings');
    });