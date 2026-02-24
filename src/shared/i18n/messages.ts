export type I18nKey =
  | 'nav.dashboard'
  | 'nav.community'
  | 'nav.treasury'
  | 'nav.governance'
  | 'nav.announcements'
  | 'nav.calendar'
  | 'nav.vigilancia'
  | 'nav.settings'
  | 'nav.rules'
  | 'nav.members'
  | 'nav.entities'
  | 'nav.documents'
  | 'nav.census'
  | 'nav.import'
  | 'nav.payments'
  | 'nav.more'
  | 'nav.section.nation'
  | 'nav.section.treasury'
  | 'nav.section.governance'
  | 'nav.section.services'
  | 'nav.section.admin'
  | 'nav.switcher.title'
  | 'nav.switcher.new'
  | 'nav.search'
  | 'dashboard.title'
  | 'dashboard.greeting'
  | 'dashboard.legalFramework'
  | 'dashboard.loading'
  | 'dashboard.error'
  | 'dashboard.health.excellent'
  | 'dashboard.health.healthy'
  | 'dashboard.health.attention'
  | 'dashboard.health.critical'
  | 'dashboard.proposals'
  | 'dashboard.assemblies'
  | 'dashboard.viewAll'
  | 'dashboard.recentActivity'
  | 'dashboard.systemConfig'
  | 'dashboard.latestTransactions'
  | 'dashboard.incomeVsExpense'
  | 'community.tabs.members'
  | 'community.tabs.directory'
  | 'community.tabs.activity'
  | 'community.title'
  | 'community.subtitle'
  | 'common.settings'
  | 'common.logout'
  | 'common.save'
  | 'common.saving'
  | 'common.cancel'
  | 'common.edit'
  | 'common.delete'
  | 'common.add'
  | 'common.close'
  | 'common.confirm'
  | 'common.send'
  | 'common.sending'
  | 'common.search'
  | 'common.email'
  | 'common.password'
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'common.back'
  | 'common.name'
  | 'onboarding.step.type'
  | 'onboarding.step.data'
  | 'onboarding.step.structure'
  | 'onboarding.step.categories'
  | 'onboarding.step.rules'
  | 'onboarding.step.confirm'
  | 'onboarding.back'
  | 'onboarding.next'
  | 'onboarding.cancel'
  | 'onboarding.create'
  | 'onboarding.creating'
  | 'settings.title'
  | 'settings.adminOnly'
  | 'settings.tab.general'
  | 'settings.tab.categories'
  | 'settings.tab.invitations'
  | 'settings.tab.rules'
  | 'settings.tab.privacy'
  | 'settings.tab.terms'
  | 'treasury.title'
  | 'treasury.subtitle'
  | 'treasury.mode.import'
  | 'treasury.mode.fintech_rail'
  | 'treasury.mode.connector'
  | 'treasury.mode.hybrid'
  | 'treasury.section.resumen'
  | 'treasury.section.resumen.desc'
  | 'treasury.section.cobro'
  | 'treasury.section.cobro.desc'
  | 'treasury.section.programacion'
  | 'treasury.section.programacion.desc'
  | 'treasury.section.datos'
  | 'treasury.section.datos.desc'
  | 'treasury.export.pdf.title'
  | 'treasury.export.excel.title'
  | 'treasury.import'
  | 'treasury.manualCapture'
  | 'treasury.banner.phase2'
  | 'treasury.fund'
  | 'treasury.cobro.obligations'
  | 'treasury.cobro.collection'
  | 'treasury.cobro.myPayments'
  | 'treasury.programacion.recurring'
  | 'treasury.programacion.contracts'
  | 'treasury.programacion.paymentPlans'
  | 'treasury.datos.transactions'
  | 'treasury.datos.budgets'
  | 'treasury.datos.statements'
  | 'treasury.member.subtitle'
  | 'treasury.member.loading'
  | 'treasury.member.totalPendiente'
  | 'treasury.member.totalPagado'
  | 'treasury.member.estadoFinanciero'
  | 'treasury.member.status.moroso'
  | 'treasury.member.status.pendiente'
  | 'treasury.member.status.alCorriente'
  | 'treasury.member.resumenComunidad'
  | 'governance.title'
  | 'governance.subtitle.proposals'
  | 'governance.subtitle.assemblies'
  | 'governance.export'
  | 'governance.newAssembly'
  | 'governance.newProposal'
  | 'governance.tab.proposals'
  | 'governance.tab.active'
  | 'governance.tab.discussion'
  | 'governance.tab.draft'
  | 'governance.tab.closed'
  | 'governance.tab.all'
  | 'governance.tab.assemblies'
  | 'governance.tab.delegations'
  | 'governance.tab.minutes'
  | 'governance.tab.rules'
  | 'members.title'
  | 'members.subtitle'
  | 'members.export'
  | 'transactions.toast.verified'
  | 'transactions.toast.verifyError'
  | 'transactions.toast.updateError'
  | 'transactions.toast.deleted'
  | 'transactions.toast.deleteError'
  | 'transactions.confirmDelete'
  | 'transactions.filter.allTypes'
  | 'transactions.filter.income'
  | 'transactions.filter.expense'
  | 'transactions.filter.from'
  | 'transactions.filter.to'
  | 'transactions.table.date'
  | 'transactions.table.description'
  | 'transactions.table.category'
  | 'transactions.table.type'
  | 'transactions.table.origin'
  | 'transactions.table.verification'
  | 'transactions.table.amount'
  | 'transactions.table.actions'
  | 'transactions.table.loading'
  | 'transactions.table.empty'
  | 'transactions.edit.noCategory'
  | 'transactions.edit.save'
  | 'transactions.edit.cancel'
  | 'transactions.badge.income'
  | 'transactions.badge.expense'
  | 'transactions.origin.rail'
  | 'transactions.origin.import'
  | 'transactions.origin.system'
  | 'transactions.origin.manual'
  | 'transactions.verification.verified'
  | 'transactions.verification.disputed'
  | 'transactions.verification.reported'
  | 'transactions.action.verify'
  | 'transactions.action.edit'
  | 'transactions.action.delete'
  | 'transactions.modal.title'
  | 'obligations.summary.pending'
  | 'obligations.summary.overdue'
  | 'obligations.summary.paid'
  | 'obligations.filter.allStatuses'
  | 'obligations.status.pending'
  | 'obligations.status.paid'
  | 'obligations.status.overdue'
  | 'obligations.status.partial'
  | 'obligations.new'
  | 'obligations.table.member'
  | 'obligations.table.concept'
  | 'obligations.table.amount'
  | 'obligations.table.dueDate'
  | 'obligations.table.status'
  | 'obligations.table.link'
  | 'obligations.table.actions'
  | 'obligations.table.loading'
  | 'obligations.table.empty'
  | 'obligations.linkedTx'
  | 'obligations.registerPayment'
  | 'proposals.loading'
  | 'proposals.empty'
  | 'proposals.status.draft'
  | 'proposals.status.discussion'
  | 'proposals.status.active'
  | 'proposals.status.closed'
  | 'proposals.status.approved'
  | 'proposals.status.rejected'
  | 'proposals.status.executed'
  | 'proposals.type.ordinary'
  | 'proposals.type.extraordinary'
  | 'proposals.type.budget'
  | 'proposals.type.election'
  | 'proposals.type.amendment'
  | 'proposals.meta.created'
  | 'proposals.meta.voting'
  | 'proposals.meta.close'
  | 'assemblies.loading'
  | 'assemblies.empty'
  | 'assemblies.present'
  | 'assemblies.quorumMet'
  | 'assemblies.status.scheduled'
  | 'assemblies.status.convened'
  | 'assemblies.status.in_session'
  | 'assemblies.status.first_call'
  | 'assemblies.status.second_call'
  | 'assemblies.status.third_call'
  | 'assemblies.status.completed'
  | 'assemblies.status.cancelled'
  | 'assemblies.type.ordinary'
  | 'assemblies.type.extraordinary'
  | 'obligationDialog.title'
  | 'obligationDialog.error.required'
  | 'obligationDialog.error.memberRequired'
  | 'obligationDialog.error.amountPositive'
  | 'obligationDialog.error.amountLimit'
  | 'obligationDialog.error.noActiveMembers'
  | 'obligationDialog.error.create'
  | 'obligationDialog.forAll'
  | 'obligationDialog.member'
  | 'obligationDialog.memberPlaceholder'
  | 'obligationDialog.concept'
  | 'obligationDialog.conceptPlaceholder'
  | 'obligationDialog.amount'
  | 'obligationDialog.dueDate'
  | 'obligationDialog.cancel'
  | 'obligationDialog.create'
  | 'obligationDialog.creating'
  | 'paymentDialog.title'
  | 'paymentDialog.error.register'
  | 'paymentDialog.concept'
  | 'paymentDialog.method'
  | 'paymentDialog.reference'
  | 'paymentDialog.referencePlaceholder'
  | 'paymentDialog.date'
  | 'paymentDialog.notes'
  | 'paymentDialog.notesPlaceholder'
  | 'paymentDialog.info'
  | 'paymentDialog.cancel'
  | 'paymentDialog.confirm'
  | 'paymentDialog.registering'
  | 'proposalDialog.title'
  | 'proposalDialog.titleWithTemplate'
  | 'proposalDialog.noPermissionTitle'
  | 'proposalDialog.selectTemplate'
  | 'proposalDialog.type'
  | 'proposalDialog.error.noPermission'
  | 'proposalDialog.error.titleRequired'
  | 'proposalDialog.error.descriptionRequired'
  | 'proposalDialog.error.typeRequired'
  | 'proposalDialog.error.quorum'
  | 'proposalDialog.error.majority'
  | 'proposalDialog.error.endFuture'
  | 'proposalDialog.error.startBeforeEnd'
  | 'proposalDialog.error.multipleChoiceMin'
  | 'proposalDialog.error.fiAmount'
  | 'proposalDialog.error.fiNewAmount'
  | 'proposalDialog.error.create'
  | 'proposalDialog.note.election'
  | 'proposalDialog.quorum'
  | 'proposalDialog.majority'
  | 'proposalDialog.rulesDefined'
  | 'proposalDialog.votingModel'
  | 'proposalDialog.voting.simple'
  | 'proposalDialog.voting.consensus'
  | 'proposalDialog.voting.multiple'
  | 'proposalDialog.voting.consensusHelp'
  | 'proposalDialog.voting.multipleHelp'
  | 'proposalDialog.voting.option'
  | 'proposalDialog.voting.addOption'
  | 'proposalDialog.discussion.title'
  | 'proposalDialog.discussion.include'
  | 'proposalDialog.discussion.required'
  | 'proposalDialog.discussion.duration'
  | 'proposalDialog.discussion.help'
  | 'proposalDialog.votingStart'
  | 'proposalDialog.votingEnd'
  | 'proposalDialog.autoExecution'
  | 'proposalDialog.back'
  | 'proposalDialog.create'
  | 'proposalDialog.creating'
  | 'assemblyDialog.title'
  | 'assemblyDialog.type'
  | 'assemblyDialog.type.ordinary'
  | 'assemblyDialog.type.extraordinary'
  | 'assemblyDialog.titleLabel'
  | 'assemblyDialog.titlePlaceholder'
  | 'assemblyDialog.date'
  | 'assemblyDialog.noticeWarning'
  | 'assemblyDialog.location'
  | 'assemblyDialog.locationPlaceholder'
  | 'assemblyDialog.agenda'
  | 'assemblyDialog.addItem'
  | 'assemblyDialog.topicPlaceholder'
  | 'assemblyDialog.descriptionPlaceholder'
  | 'assemblyDialog.error.titleRequired'
  | 'assemblyDialog.error.dateRequired'
  | 'assemblyDialog.error.locationRequired'
  | 'assemblyDialog.error.agendaTopicRequired'
  | 'assemblyDialog.error.create'
  | 'assemblyDialog.success'
  | 'assemblyDialog.cancel'
  | 'assemblyDialog.create'
  | 'assemblyDialog.creating'
  | 'proposalDetail.back'
  | 'proposalDetail.title'
  | 'proposalDetail.notFound'
  | 'assemblyDetail.loading'
  | 'assemblyDetail.notFound'
  | 'assemblyDetail.backToGovernance'
  | 'assemblyDetail.defaultCaller'
  | 'assemblyDetail.actions'
  | 'assemblyDetail.startFirstCall'
  | 'assemblyDetail.toSecondCall'
  | 'assemblyDetail.toThirdCall'
  | 'assemblyDetail.startSession'
  | 'assemblyDetail.complete'
  | 'assemblyDetail.completeAssembly'
  | 'assemblyDetail.cancel'
  | 'assemblyDetail.agenda'
  | 'assemblyDetail.calls'
  | 'assemblyDetail.notes'
  | 'assemblyDetail.memberFallback'
  | 'assemblyDetail.toast.statusUpdated'
  | 'assemblyDetail.toast.statusError'
  | 'generalFields.title'
  | 'generalFields.titlePlaceholder'
  | 'generalFields.description'
  | 'generalFields.descriptionPlaceholder'
  | 'gastoFields.fund.maintenance'
  | 'gastoFields.fund.reserve'
  | 'gastoFields.title'
  | 'gastoFields.conceptLabel'
  | 'gastoFields.quotesLabel'
  | 'gastoFields.quotesPlaceholder'
  | 'gastoFields.fundLabel'
  | 'gastoFields.entityLabel'
  | 'gastoFields.entityPlaceholder'
  | 'gastoFields.amountLabel'
  | 'gastoFields.amountPlaceholder'
  | 'gastoFields.conceptPlaceholder'
  | 'gastoFields.desc.concept'
  | 'gastoFields.desc.quotes'
  | 'cuotaFields.type.ordinary'
  | 'cuotaFields.type.extraordinary'
  | 'cuotaFields.currentAmountLabel'
  | 'cuotaFields.currentAmountPlaceholder'
  | 'cuotaFields.newAmountLabel'
  | 'cuotaFields.effectiveDateLabel'
  | 'cuotaFields.appliesToLabel'
  | 'cuotaFields.appliesToPlaceholder'
  | 'cuotaFields.impactTitle'
  | 'cuotaFields.impactPeriod'
  | 'cuotaFields.titlePrefix'
  | 'cuotaFields.desc.current'
  | 'cuotaFields.desc.new'
  | 'cuotaFields.desc.indicate'
  | 'cuotaFields.desc.effective'
  | 'cuotaFields.desc.applies'
  | 'cuotaFields.desc.impact'
  | 'presupuestoFields.period.monthly'
  | 'presupuestoFields.period.quarterly'
  | 'presupuestoFields.period.yearly'
  | 'presupuestoFields.fund.maintenance'
  | 'presupuestoFields.fund.reserve'
  | 'presupuestoFields.categoryLabel'
  | 'presupuestoFields.categoryPlaceholder'
  | 'presupuestoFields.amountLabel'
  | 'presupuestoFields.periodLabel'
  | 'presupuestoFields.periodPlaceholder'
  | 'presupuestoFields.fundLabel'
  | 'presupuestoFields.fundPlaceholder'
  | 'presupuestoFields.titlePrefix'
  | 'presupuestoFields.desc.category'
  | 'presupuestoFields.desc.amount'
  | 'presupuestoFields.desc.period'
  | 'presupuestoFields.desc.fund'
  | 'cambioReglaFields.ruleLabel'
  | 'cambioReglaFields.rulePlaceholder'
  | 'cambioReglaFields.newValueLabel'
  | 'cambioReglaFields.newValuePlaceholder'
  | 'cambioReglaFields.justificationLabel'
  | 'cambioReglaFields.justificationPlaceholder'
  | 'cambioReglaFields.description.propose'
  | 'cambioReglaFields.titlePrefix'
  | 'cambioReglaFields.description.current'
  | 'cambioReglaFields.description.new'
  | 'cambioReglaFields.description.complete'
  | 'cambioReglaFields.description.justification'
  | 'cambioReglaFields.description.justificationPlaceholder'
  | 'rulePicker.noResults'
  | 'rulePicker.currentValue'
  | 'searchableSelect.placeholder'
  | 'searchableSelect.empty'
  | 'categoryPicker.label'
  | 'categoryPicker.placeholder'
  | 'categoryPicker.noResults'
  | 'categoryPicker.loading'
  | 'entityPicker.placeholder'
  | 'entityPicker.label'
  | 'entityPicker.type.provider'
  | 'entityPicker.type.contractor'
  | 'entityPicker.type.partner'
  | 'entityPicker.type.other'
  | 'entityPicker.createNew'
  | 'entityPicker.newProvider'
  | 'entityPicker.cancel'
  | 'entityPicker.namePlaceholder'
  | 'entityPicker.phonePlaceholder'
  | 'entityPicker.errorCreate'
  | 'entityPicker.creating'
  | 'entityPicker.createAndSelect'
  | 'eleccionFields.role.admin'
  | 'eleccionFields.role.vigilance'
  | 'eleccionFields.role.treasurer'
  | 'eleccionFields.titlePrefix'
  | 'eleccionFields.desc.role'
  | 'eleccionFields.desc.period'
  | 'eleccionFields.desc.candidates'
  | 'eleccionFields.desc.warning'
  | 'eleccionFields.roleLabel'
  | 'eleccionFields.rolePlaceholder'
  | 'eleccionFields.candidatesLabel'
  | 'eleccionFields.add'
  | 'eleccionFields.candidatePlaceholder'
  | 'eleccionFields.removeCandidate'
  | 'eleccionFields.periodLabel'
  | 'eleccionFields.periodPlaceholder'
  | 'eleccionFields.includeWarning'
  | 'emergenciaFields.titlePrefix'
  | 'emergenciaFields.desc.intro'
  | 'emergenciaFields.desc.beneficiary'
  | 'emergenciaFields.desc.amount'
  | 'emergenciaFields.desc.evidence'
  | 'emergenciaFields.desc.justification'
  | 'emergenciaFields.alert'
  | 'emergenciaFields.beneficiaryLabel'
  | 'emergenciaFields.beneficiaryPlaceholder'
  | 'emergenciaFields.amountLabel'
  | 'emergenciaFields.evidenceLabel'
  | 'emergenciaFields.evidencePlaceholder'
  | 'emergenciaFields.justificationLabel'
  | 'emergenciaFields.justificationPlaceholder'
  | 'obraFields.titlePrefix'
  | 'obraFields.desc.contractor'
  | 'obraFields.desc.total'
  | 'obraFields.desc.duration'
  | 'obraFields.desc.schedule'
  | 'obraFields.desc.quotes'
  | 'obraFields.desc.noValue'
  | 'obraFields.desc.scheduleFallback'
  | 'obraFields.contractorLabel'
  | 'obraFields.contractorPlaceholder'
  | 'obraFields.totalLabel'
  | 'obraFields.durationLabel'
  | 'obraFields.durationPlaceholder'
  | 'obraFields.scheduleLabel'
  | 'obraFields.phase'
  | 'obraFields.phasePlaceholder'
  | 'obraFields.amountPlaceholder'
  | 'obraFields.datePlaceholder'
  | 'obraFields.removeRow'
  | 'obraFields.quotesLabel'
  | 'obraFields.quotesPlaceholder'
  | 'obraFields.quotesWarning'
  | 'admisionFields.doc.id'
  | 'admisionFields.doc.address'
  | 'admisionFields.doc.signedRequest'
  | 'admisionFields.doc.others'
  | 'admisionFields.titlePrefix'
  | 'admisionFields.desc.candidate'
  | 'admisionFields.desc.email'
  | 'admisionFields.desc.unit'
  | 'admisionFields.desc.docs'
  | 'admisionFields.desc.docLine'
  | 'admisionFields.yes'
  | 'admisionFields.no'
  | 'admisionFields.candidateLabel'
  | 'admisionFields.candidatePlaceholder'
  | 'admisionFields.emailLabel'
  | 'admisionFields.emailPlaceholder'
  | 'admisionFields.unitLabel'
  | 'admisionFields.unitPlaceholder'
  | 'admisionFields.docsLabel'
  | 'proposalDetail.loading'
  | 'proposalDetail.notFoundAccess'
  | 'proposalDetail.backToGovernance'
  | 'proposalDetail.status.draft'
  | 'proposalDetail.status.discussion'
  | 'proposalDetail.status.active'
  | 'proposalDetail.status.closed'
  | 'proposalDetail.status.approved'
  | 'proposalDetail.status.rejected'
  | 'proposalDetail.status.executed'
  | 'proposalDetail.countdown.expired'
  | 'proposalDetail.countdown.time'
  | 'proposalDetail.countdown.timeLeft'
  | 'proposalDetail.badge.appealed'
  | 'proposalDetail.meta.by'
  | 'proposalDetail.meta.created'
  | 'proposalDetail.meta.discussion'
  | 'proposalDetail.meta.votingStart'
  | 'proposalDetail.meta.close'
  | 'proposalDetail.meta.quorum'
  | 'proposalDetail.meta.majority'
  | 'proposalDetail.model.consensus'
  | 'proposalDetail.model.multiple'
  | 'proposalDetail.closed'
  | 'proposalDetail.method'
  | 'proposalDetail.method.autoClose'
  | 'proposalDetail.countdown.discussion'
  | 'proposalDetail.countdown.voting'
  | 'proposalDetail.countdown.appeal'
  | 'proposalDetail.appealedPaused'
  | 'proposalDetail.discussionHours'
  | 'proposalDetail.starting'
  | 'proposalDetail.startDiscussion'
  | 'proposalDetail.votingClose'
  | 'proposalDetail.opening'
  | 'proposalDetail.openVoting'
  | 'proposalDetail.openDirectVoting'
  | 'proposalDetail.closeVoting'
  | 'proposalDetail.appealing'
  | 'proposalDetail.appealProposal'
  | 'proposalDetail.outcomeTitle'
  | 'proposalDetail.outcomeDeclared'
  | 'proposalDetail.outcomeDeclaredAt'
  | 'proposalDetail.outcomePlaceholder'
  | 'proposalDetail.declaring'
  | 'proposalDetail.declareOutcome'
  | 'proposalDetail.cancel'
  | 'proposalDetail.voteRegistered'
  | 'proposalDetail.voteError'
  | 'proposalDetail.toast.discussionStarted'
  | 'proposalDetail.toast.discussionError'
  | 'proposalDetail.toast.votingOpened'
  | 'proposalDetail.toast.votingOpenError'
  | 'proposalDetail.toast.outcomeDeclared'
  | 'proposalDetail.toast.outcomeError'
  | 'proposalDetail.toast.appealed'
  | 'proposalDetail.toast.appealError'
  | 'proposalDetail.financialInstruction'
  | 'proposalDetail.fi.type'
  | 'proposalDetail.fi.amount'
  | 'proposalDetail.fi.newAmount'
  | 'proposalDetail.fi.description'
  | 'proposalDetail.fi.period'
  | 'proposalDetail.fi.effectiveDate'
  | 'proposalDetail.fi.beneficiary'
  | 'proposalDetail.fi.config'
  | 'proposalDetail.fi.type.disbursement'
  | 'proposalDetail.fi.type.budgetAllocation'
  | 'proposalDetail.fi.type.quotaChange'
  | 'proposalDetail.fi.type.configChange'
  | 'proposalDetail.fi.type.none'
  | 'proposalDetail.executedAt'
  | 'proposalDetail.executionPausedByAppeal'
  | 'proposalDetail.cooldownRunning'
  | 'proposalDetail.cooldownComplete'
  | 'proposalDetail.executeNow'
  | 'proposalDetail.executing'
  | 'proposalDetail.executionFailed'
  | 'proposalDetail.retrying'
  | 'proposalDetail.retryExecution'
  | 'proposalDetail.executeManually'
  | 'attendance.title'
  | 'attendance.presentCount'
  | 'attendance.indiviso'
  | 'attendance.searchPlaceholder'
  | 'attendance.markAll'
  | 'attendance.saving'
  | 'attendance.save'
  | 'attendance.weight'
  | 'attendance.toast.saved'
  | 'attendance.toast.error'
  | 'convocatoria.title'
  | 'convocatoria.badge.noticeValid'
  | 'convocatoria.badge.noticeInsufficient'
  | 'convocatoria.typeLabel'
  | 'convocatoria.locationLabel'
  | 'convocatoria.locationMissing'
  | 'convocatoria.dateLabel'
  | 'convocatoria.calledByLabel'
  | 'convocatoria.calledByDefault'
  | 'convocatoria.issuedLabel'
  | 'convocatoria.noticeLabel'
  | 'convocatoria.noticeValue'
  | 'convocatoria.agenda'
  | 'convocatoria.notificationsDelivered'
  | 'proxy.title'
  | 'proxy.activeCount'
  | 'proxy.rulesTitle'
  | 'proxy.rule.1'
  | 'proxy.rule.2'
  | 'proxy.rule.3'
  | 'proxy.loading'
  | 'proxy.activeList'
  | 'proxy.maxReached'
  | 'proxy.revoke'
  | 'proxy.empty'
  | 'proxy.grant'
  | 'proxy.grantorPlaceholder'
  | 'proxy.representativePlaceholder'
  | 'proxy.representationsCount'
  | 'proxy.granting'
  | 'proxy.grantButton'
  | 'proxy.noRepresentatives'
  | 'proxy.toast.granted'
  | 'proxy.toast.grantError'
  | 'proxy.toast.revoked'
  | 'proxy.toast.revokeError'
  | 'votingPanel.title'
  | 'votingPanel.toast.success'
  | 'votingPanel.toast.error'
  | 'votingPanel.voiceOnly'
  | 'votingPanel.alreadyVoted'
  | 'votingPanel.canChange'
  | 'votingPanel.yes'
  | 'votingPanel.no'
  | 'votingPanel.abstain'
  | 'multipleChoice.title'
  | 'multipleChoice.myVote'
  | 'multipleChoice.votesCount'
  | 'multipleChoice.totalVotes'
  | 'consensus.option.agree'
  | 'consensus.option.disagree'
  | 'consensus.option.abstain'
  | 'consensus.option.block'
  | 'consensus.blocked'
  | 'consensus.myVote'
  | 'consensus.reason'
  | 'consensus.blockWarning'
  | 'consensus.blockPlaceholder'
  | 'consensus.confirmBlock'
  | 'consensus.cancel'
  | 'consensus.agree'
  | 'consensus.disagree'
  | 'consensus.abstain'
  | 'consensus.block'
  | 'consensus.blockReasons'
  | 'lifecycle.draft'
  | 'lifecycle.discussion'
  | 'lifecycle.voting'
  | 'lifecycle.result'
  | 'lifecycle.executed'
  | 'delegation.title'
  | 'delegation.votingFor'
  | 'delegation.toMe'
  | 'delegation.you'
  | 'delegation.myDelegation'
  | 'delegation.revoke'
  | 'delegation.placeholder'
  | 'delegation.delegate'
  | 'delegation.empty'
  | 'delegation.toast.created'
  | 'delegation.toast.createError'
  | 'delegation.toast.revoked'
  | 'delegation.toast.revokeError'
  | 'minutes.title'
  | 'minutes.approved'
  | 'minutes.approvedAt'
  | 'minutes.signatures'
  | 'minutes.role.secretary'
  | 'minutes.role.committee'
  | 'minutes.memberFallback'
  | 'minutes.approving'
  | 'minutes.approve'
  | 'minutes.signing'
  | 'minutes.sign'
  | 'minutes.alreadySigned'
  | 'minutes.description'
  | 'minutes.generating'
  | 'minutes.generate'
  | 'votingViz.title'
  | 'votingViz.multipleTitle'
  | 'votingViz.weight'
  | 'votingViz.votes'
  | 'votingViz.participation'
  | 'votingViz.quorum'
  | 'votingViz.majority'
  | 'votingViz.reached'
  | 'votingViz.notReached'
  | 'votingViz.notReachedF'
  | 'votingViz.totalVotes'
  | 'delivery.status.delivered'
  | 'delivery.status.sent'
  | 'delivery.status.pending'
  | 'delivery.status.failed'
  | 'delivery.loading'
  | 'delivery.empty'
  | 'delivery.title'
  | 'delivery.rate'
  | 'assemblyDetail.status.scheduled'
  | 'assemblyDetail.status.convened'
  | 'assemblyDetail.status.inSession'
  | 'assemblyDetail.status.firstCall'
  | 'assemblyDetail.status.secondCall'
  | 'assemblyDetail.status.thirdCall'
  | 'assemblyDetail.status.completed'
  | 'assemblyDetail.status.cancelled'
  | 'assemblyDetail.type.ordinary'
  | 'assemblyDetail.type.extraordinary'
  | 'assemblyDetail.loading'
  | 'assemblyDetail.notFound'
  | 'assemblyDetail.statusUpdated'
  | 'assemblyDetail.statusUpdateError'
  | 'assemblyDetail.action.startFirst'
  | 'assemblyDetail.action.cancel'
  | 'assemblyDetail.action.toSecond'
  | 'assemblyDetail.action.startSession'
  | 'assemblyDetail.action.toThird'
  | 'assemblyDetail.action.complete'
  | 'assemblyDetail.quorumMet'
  | 'assemblyDetail.noLocation'
  | 'assemblyDetail.calledBy'
  | 'assemblyDetail.callerDefault'
  | 'assemblyDetail.agenda'
  | 'assemblyDetail.notes'
  | 'context.ruleChange.title'
  | 'context.currentValue'
  | 'context.proposedValue'
  | 'context.key'
  | 'context.current'
  | 'context.proposed'
  | 'context.noRuleDetail'
  | 'context.viewRules'
  | 'context.disbursement'
  | 'context.emergencyExpense'
  | 'context.majorWork'
  | 'context.amount'
  | 'context.currentBalance'
  | 'context.impact'
  | 'context.moreThanHalf'
  | 'context.category'
  | 'context.beneficiary'
  | 'context.viewEntity'
  | 'context.viewTreasury'
  | 'context.quotaChange'
  | 'context.newFee'
  | 'context.activeMembers'
  | 'context.monthlyCollection'
  | 'context.effectiveDate'
  | 'context.quotaExecuteWarning'
  | 'context.viewCollection'
  | 'context.budgetAllocation'
  | 'context.assignedAmount'
  | 'context.period'
  | 'context.viewBudgets'
  | 'context.memberAdmission'
  | 'context.memberAdmissionDescription'
  | 'context.memberAdmissionWarning'
  | 'context.viewMembers'
  | 'context.electionTitle'
  | 'context.electionDescription'
  | 'context.currentRoles'
  | 'context.periodN'
  | 'context.electionLegal'
  | 'context.viewAdminTerms'
  | 'invite.title'
  | 'invite.description'
  | 'invite.sent'
  | 'invite.sentDescription'
  | 'invite.emailSent'
  | 'invite.linkLabel'
  | 'invite.copyLink'
  | 'invite.close'
  | 'invite.emailLabel'
  | 'invite.roleLabel'
  | 'invite.emailRequired'
  | 'invite.emailInvalid'
  | 'invite.errorGeneric'
  | 'invite.cancel'
  | 'invite.send'
  | 'invite.sending'
  | 'memberDir.searchPlaceholder'
  | 'memberDir.allRoles'
  | 'memberDir.allStatuses'
  | 'memberDir.statusActive'
  | 'memberDir.statusInactive'
  | 'memberDir.statusPending'
  | 'memberDir.invite'
  | 'memberDir.loading'
  | 'memberDir.empty'
  | 'memberDir.col.member'
  | 'memberDir.col.email'
  | 'memberDir.col.role'
  | 'memberDir.col.status'
  | 'memberDir.col.standing'
  | 'memberDir.col.since'
  | 'memberDir.col.actions'
  | 'memberDir.noName'
  | 'memberDir.active'
  | 'memberDir.deactivate'
  | 'memberDir.reactivate'
  | 'memberDir.roleUpdated'
  | 'memberDir.roleError'
  | 'memberDir.deactivated'
  | 'memberDir.deactivateError'
  | 'memberDir.reactivated'
  | 'memberDir.reactivateError'
  // Page titles & subtitles
  | 'announcements.title'
  | 'announcements.subtitle'
  | 'calendar.title'
  | 'calendar.subtitle'
  | 'calendar.today'
  | 'calendar.eventsFor'
  | 'calendar.noEvents'
  | 'documents.title'
  | 'documents.subtitle'
  | 'documents.upload'
  | 'documents.communityDocs'
  | 'documents.searchPlaceholder'
  | 'documents.loading'
  | 'documents.noResults'
  | 'documents.empty'
  | 'documents.noResultsHint'
  | 'documents.emptyHint'
  | 'profile.title'
  | 'profile.subtitle'
  | 'profile.personalInfo'
  | 'profile.fullName'
  | 'profile.email'
  | 'profile.emailHint'
  | 'profile.saveChanges'
  | 'profile.saving'
  | 'profile.nameUpdated'
  | 'profile.changePassword'
  | 'profile.newPassword'
  | 'profile.confirmPassword'
  | 'profile.updatePassword'
  | 'profile.updating'
  | 'profile.passwordUpdated'
  | 'profile.myCommunities'
  | 'profile.noCommunities'
  | 'profile.switchTo'
  | 'profile.current'
  | 'profile.activitySummary'
  | 'profile.roleInCommunity'
  | 'profile.financialStatus'
  | 'profile.votingWeight'
  | 'profile.memberSince'
  | 'profile.dataPrivacy'
  | 'settings.subtitle'
  | 'settings.tab.notifications'
  | 'settings.tab.audit'
  | 'settings.categories.title'
  | 'settings.invitations.title'
  | 'settings.invitations.create'
  | 'settings.invitations.empty'
  | 'settings.backToPanel'
  | 'governance.subtitle.delegations'
  | 'governance.subtitle.minutes'
  | 'governance.subtitle.rules'
  | 'governance.loadingMember'
  | 'community.directory.members'
  | 'community.directory.providers'
  | 'residential.title'
  | 'residential.subtitle'
  | 'memberDetail.title'
  | 'memberDetail.back'
  | 'memberDetail.loading'
  | 'memberDetail.notFound'
  | 'entityDetail.title'
  | 'common.notFound'
  // Announcements, auth, contracts, deliberation, entities, recurring, treasury
  | 'announcements.confirmDelete'
  | 'announcements.deleted'
  | 'announcements.edit'
  | 'announcements.empty'
  | 'announcements.errorDeleting'
  | 'announcements.errorSaving'
  | 'announcements.expires'
  | 'announcements.expiresOptional'
  | 'announcements.message'
  | 'announcements.new'
  | 'announcements.pin'
  | 'announcements.pinToTop'
  | 'announcements.priority'
  | 'announcements.priority.low'
  | 'announcements.priority.normal'
  | 'announcements.priority.urgent'
  | 'announcements.publish'
  | 'announcements.publishFirst'
  | 'announcements.published'
  | 'announcements.publishedCount'
  | 'announcements.unpin'
  | 'announcements.updated'
  | 'auth.forgotPassword.backToLogin'
  | 'auth.forgotPassword.checkEmail'
  | 'auth.forgotPassword.checkInbox'
  | 'auth.forgotPassword.ifAccountExists'
  | 'auth.forgotPassword.linkExpiry'
  | 'auth.forgotPassword.sendAgain'
  | 'auth.forgotPassword.sendResetLink'
  | 'auth.forgotPassword.subtitle'
  | 'auth.forgotPassword.title'
  | 'auth.forgotPassword.willReceiveLink'
  | 'auth.invite.acceptError'
  | 'auth.invite.acceptInvitation'
  | 'auth.invite.acceptedRedirecting'
  | 'auth.invite.accepting'
  | 'auth.invite.asRole'
  | 'auth.invite.createAccount'
  | 'auth.invite.createOrLogin'
  | 'auth.invite.goHome'
  | 'auth.invite.invalidDesc'
  | 'auth.invite.invalidTitle'
  | 'auth.invite.invitedAsRole'
  | 'auth.invite.invitedEmail'
  | 'auth.invite.invitedTo'
  | 'auth.invite.invitedWithRole'
  | 'auth.invite.pendingTitle'
  | 'auth.invite.signIn'
  | 'auth.invite.verifyError'
  | 'auth.invite.verifying'
  | 'auth.invite.welcome'
  | 'auth.invite.withRole'
  | 'auth.invite.youAreInvited'
  | 'auth.login.error'
  | 'auth.login.forgotPassword'
  | 'auth.login.inviteMessage'
  | 'auth.login.noAccount'
  | 'auth.login.signUp'
  | 'auth.login.signingIn'
  | 'auth.login.subtitle'
  | 'auth.login.title'
  | 'auth.register.checkEmail'
  | 'auth.register.confirmToAccess'
  | 'auth.register.confirmationSent'
  | 'auth.register.error'
  | 'auth.register.fullName'
  | 'auth.register.goToLogin'
  | 'auth.register.hasAccount'
  | 'auth.register.minChars'
  | 'auth.register.registering'
  | 'auth.register.signIn'
  | 'auth.register.subtitle'
  | 'auth.register.title'
  | 'auth.resetPassword.backToLogin'
  | 'auth.resetPassword.confirmPassword'
  | 'auth.resetPassword.enterNewPassword'
  | 'auth.resetPassword.invalidLink'
  | 'auth.resetPassword.invalidLinkDesc'
  | 'auth.resetPassword.linksExpire'
  | 'auth.resetPassword.newPassword'
  | 'auth.resetPassword.passwordsMatch'
  | 'auth.resetPassword.passwordsNoMatch'
  | 'auth.resetPassword.repeatPassword'
  | 'auth.resetPassword.req.lowercase'
  | 'auth.resetPassword.req.minChars'
  | 'auth.resetPassword.req.number'
  | 'auth.resetPassword.req.uppercase'
  | 'auth.resetPassword.requestNewLink'
  | 'auth.resetPassword.requirementsNotMet'
  | 'auth.resetPassword.strength.fair'
  | 'auth.resetPassword.strength.good'
  | 'auth.resetPassword.strength.strong'
  | 'auth.resetPassword.strength.weak'
  | 'auth.resetPassword.strengthLabel'
  | 'auth.resetPassword.subtitle'
  | 'auth.resetPassword.successDesc'
  | 'auth.resetPassword.successTitle'
  | 'auth.resetPassword.title'
  | 'auth.resetPassword.updateError'
  | 'auth.resetPassword.updatePassword'
  | 'auth.resetPassword.updating'
  | 'auth.resetPassword.validatingRequest'
  | 'auth.resetPassword.verifyingLink'
  | 'contracts.action'
  | 'contracts.activeContracts'
  | 'contracts.allStatuses'
  | 'contracts.approvedByProposal'
  | 'contracts.backToContracts'
  | 'contracts.by'
  | 'contracts.compliance'
  | 'contracts.confirmDelete'
  | 'contracts.confirmRegisterPayment'
  | 'contracts.contract'
  | 'contracts.contractParties'
  | 'contracts.create'
  | 'contracts.created'
  | 'contracts.createdBy'
  | 'contracts.creating'
  | 'contracts.defaulted'
  | 'contracts.deleteContract'
  | 'contracts.deleted'
  | 'contracts.description'
  | 'contracts.descriptionLabel'
  | 'contracts.dueDate'
  | 'contracts.empty'
  | 'contracts.endDate'
  | 'contracts.entity'
  | 'contracts.entityProvider'
  | 'contracts.errorCreating'
  | 'contracts.errorDeleting'
  | 'contracts.errorRegisteringPayment'
  | 'contracts.errorUpdatingStatus'
  | 'contracts.freq.annual'
  | 'contracts.freq.bimonthly'
  | 'contracts.freq.biweekly'
  | 'contracts.freq.monthly'
  | 'contracts.freq.oneTime'
  | 'contracts.freq.quarterly'
  | 'contracts.freq.semiannual'
  | 'contracts.freq.weekly'
  | 'contracts.indefinite'
  | 'contracts.installmentAutoGenNote'
  | 'contracts.installments'
  | 'contracts.loadingInstallments'
  | 'contracts.member'
  | 'contracts.nameAndAmountRequired'
  | 'contracts.namePlaceholder'
  | 'contracts.new'
  | 'contracts.noEntity'
  | 'contracts.noLinkedParties'
  | 'contracts.numInstallments'
  | 'contracts.paidDate'
  | 'contracts.pay'
  | 'contracts.paymentFrequency'
  | 'contracts.paymentPlan'
  | 'contracts.paymentRegistered'
  | 'contracts.registerPayment'
  | 'contracts.startDate'
  | 'contracts.statusUpdated'
  | 'contracts.totalAmount'
  | 'deliberation.comment'
  | 'deliberation.commentPlaceholder'
  | 'deliberation.confirmDeleteComment'
  | 'deliberation.ctrlEnterToSend'
  | 'deliberation.edited'
  | 'deliberation.member'
  | 'deliberation.reply'
  | 'deliberation.stance'
  | 'deliberation.writeReplyPlaceholder'
  | 'entities.actions'
  | 'entities.address'
  | 'entities.addressPlaceholder'
  | 'entities.allStatuses'
  | 'entities.allTypes'
  | 'entities.confirmDelete'
  | 'entities.contact'
  | 'entities.contactPerson'
  | 'entities.contactPersonPlaceholder'
  | 'entities.create'
  | 'entities.creating'
  | 'entities.deleted'
  | 'entities.empty'
  | 'entities.errorCreating'
  | 'entities.errorDeleting'
  | 'entities.namePlaceholder'
  | 'entities.nameRequired'
  | 'entities.new'
  | 'entities.notes'
  | 'entities.notesPlaceholder'
  | 'entities.optional'
  | 'entities.phone'
  | 'entities.rating'
  | 'entities.rfc'
  | 'entities.searchPlaceholder'
  | 'entities.status'
  | 'entities.type'
  | 'entities.unrated'
  | 'recurring.activate'
  | 'recurring.active'
  | 'recurring.activeStatus'
  | 'recurring.allActiveMembers'
  | 'recurring.allMembers'
  | 'recurring.collection'
  | 'recurring.collectionToMembers'
  | 'recurring.collections'
  | 'recurring.confirmDelete'
  | 'recurring.creating'
  | 'recurring.dayOfMonth'
  | 'recurring.deleteRecurring'
  | 'recurring.deleted'
  | 'recurring.description'
  | 'recurring.descriptionLabel'
  | 'recurring.empty'
  | 'recurring.end'
  | 'recurring.endDateOptional'
  | 'recurring.entityProviderPartner'
  | 'recurring.errorCreating'
  | 'recurring.errorDeleting'
  | 'recurring.errorProcessing'
  | 'recurring.errorRunning'
  | 'recurring.errorUpdating'
  | 'recurring.frequency'
  | 'recurring.lastRun'
  | 'recurring.members'
  | 'recurring.more'
  | 'recurring.nameAndAmountRequired'
  | 'recurring.namePlaceholder'
  | 'recurring.new'
  | 'recurring.newRecurring'
  | 'recurring.nextRun'
  | 'recurring.obligationsGenerated'
  | 'recurring.pause'
  | 'recurring.paused'
  | 'recurring.payment'
  | 'recurring.paymentToEntity'
  | 'recurring.payments'
  | 'recurring.pendingProcessed'
  | 'recurring.processPending'
  | 'recurring.runNow'
  | 'recurring.runs'
  | 'recurring.select'
  | 'recurring.specificMembers'
  | 'recurring.target'
  | 'recurring.updated'
  | 'treasury.actual'
  | 'treasury.allFieldsRequired'
  | 'treasury.amount'
  | 'treasury.budget'
  | 'treasury.budgetDeleted'
  | 'treasury.category'
  | 'treasury.categoryCreated'
  | 'treasury.categoryDeleted'
  | 'treasury.categoryNamePlaceholder'
  | 'treasury.categoryUpdated'
  | 'treasury.confirmDeleteBudget'
  | 'treasury.confirmDeleteCategory'
  | 'treasury.create'
  | 'treasury.creating'
  | 'treasury.deleteBudget'
  | 'treasury.deleteCategory'
  | 'treasury.difference'
  | 'treasury.errorCreatingBudget'
  | 'treasury.errorCreatingCategory'
  | 'treasury.errorDeletingBudget'
  | 'treasury.errorDeletingCategory'
  | 'treasury.errorUpdatingBudget'
  | 'treasury.errorUpdatingCategory'
  | 'treasury.expense'
  | 'treasury.income'
  | 'treasury.loadingBudgets'
  | 'treasury.loadingCategories'
  | 'treasury.newBudget'
  | 'treasury.noBudgets'
  | 'treasury.noCategories'
  | 'treasury.period'
  | 'treasury.selectCategory'
  | 'treasury.system'

type Dictionary = Record<I18nKey, string>

const es: Dictionary = {
  'nav.dashboard': 'Dashboard',
  'nav.community': 'Comunidad',
  'nav.treasury': 'Finanzas',
  'nav.governance': 'Gobernanza',
  'nav.announcements': 'Anuncios',
  'nav.calendar': 'Calendario',
  'nav.vigilancia': 'Vigilancia',
  'nav.settings': 'Configuración',
  'nav.rules': 'Reglamento',
  'nav.members': 'Miembros',
  'nav.entities': 'Partes Relacionadas',
  'nav.documents': 'Documentos',
  'nav.census': 'Censo',
  'nav.import': 'Importar Datos',
  'nav.payments': 'Pagos',
  'nav.more': 'Mas',
  'nav.section.nation': 'Mi Nación',
  'nav.section.treasury': 'Hacienda',
  'nav.section.governance': 'Gobierno',
  'nav.section.services': 'Servicios',
  'nav.section.admin': 'Administración',
  'nav.switcher.title': 'Tus comunidades',
  'nav.switcher.new': 'Nueva Comunidad',
  'nav.search': 'Buscar…',
  'dashboard.title': 'Estado de la Nación',
  'dashboard.greeting': 'Hola',
  'dashboard.legalFramework': 'Marco legal',
  'dashboard.loading': 'Cargando...',
  'dashboard.error': 'Error al cargar algunos datos. Intenta recargar la página.',
  'dashboard.health.excellent': 'Excelente',
  'dashboard.health.healthy': 'Saludable',
  'dashboard.health.attention': 'Atención',
  'dashboard.health.critical': 'Crítico',
  'dashboard.proposals': 'Propuestas activas',
  'dashboard.assemblies': 'Próximas asambleas',
  'dashboard.viewAll': 'Ver todas',
  'dashboard.recentActivity': 'Actividad Reciente',
  'dashboard.systemConfig': 'Configuración del Sistema',
  'dashboard.latestTransactions': 'Últimas transacciones',
  'dashboard.incomeVsExpense': 'Ingresos vs Egresos',
  'community.tabs.members': 'Miembros',
  'community.tabs.directory': 'Directorio',
  'community.tabs.activity': 'Actividad',
  'community.title': 'Comunidad',
  'community.subtitle': 'Miembros, directorio y actividad de tu comunidad',
  'common.settings': 'Administracion',
  'common.logout': 'Cerrar sesion',
  'common.save': 'Guardar',
  'common.saving': 'Guardando...',
  'common.cancel': 'Cancelar',
  'common.edit': 'Editar',
  'common.delete': 'Eliminar',
  'common.add': 'Agregar',
  'common.close': 'Cerrar',
  'common.confirm': 'Confirmar',
  'common.send': 'Enviar',
  'common.sending': 'Enviando...',
  'common.search': 'Buscar',
  'common.email': 'Correo electrónico',
  'common.password': 'Contraseña',
  'common.loading': 'Cargando...',
  'common.error': 'Error',
  'common.success': 'Listo',
  'common.back': 'Volver',
  'common.name': 'Nombre',
  'onboarding.step.type': 'Tipo',
  'onboarding.step.data': 'Datos',
  'onboarding.step.structure': 'Estructura',
  'onboarding.step.categories': 'Categorías',
  'onboarding.step.rules': 'Reglas',
  'onboarding.step.confirm': 'Confirmar',
  'onboarding.back': 'Atras',
  'onboarding.next': 'Siguiente',
  'onboarding.cancel': 'Cancelar',
  'onboarding.create': 'Crear Comunidad',
  'onboarding.creating': 'Creando...',
  'settings.title': 'Configuración de la Comunidad',
  'settings.adminOnly': 'Solo los administradores pueden acceder a esta sección.',
  'settings.tab.general': 'General',
  'settings.tab.categories': 'Categorías',
  'settings.tab.invitations': 'Invitaciones',
  'settings.tab.rules': 'Reglas',
  'settings.tab.privacy': 'Privacidad',
  'settings.tab.terms': 'Terminos',
  'treasury.title': 'Tesoreria',
  'treasury.subtitle': 'Resumen, cobro y movimientos de la comunidad',
  'treasury.mode.import': 'Importacion / Manual',
  'treasury.mode.fintech_rail': 'Fintech Rail (SPEI)',
  'treasury.mode.connector': 'Conector Bancario',
  'treasury.mode.hybrid': 'Hibrido',
  'treasury.section.resumen': 'Resumen',
  'treasury.section.resumen.desc': 'Vision general',
  'treasury.section.cobro': 'Cobro',
  'treasury.section.cobro.desc': 'Obligaciones y pagos',
  'treasury.section.programacion': 'Programacion',
  'treasury.section.programacion.desc': 'Recurrentes y contratos',
  'treasury.section.datos': 'Datos e informes',
  'treasury.section.datos.desc': 'Movimientos y reportes',
  'treasury.export.pdf.title': 'Exporta la vista actual a PDF',
  'treasury.export.excel.title': 'Exporta el listado de transacciones a Excel',
  'treasury.import': 'Importar',
  'treasury.manualCapture': 'Captura manual',
  'treasury.banner.phase2': 'Configura la integración financiera para recibir SPEI y conciliar pagos automáticamente.',
  'treasury.fund': 'Fondo',
  'treasury.cobro.obligations': 'Obligaciones',
  'treasury.cobro.collection': 'Cuenta y cobro',
  'treasury.cobro.myPayments': 'Mis pagos',
  'treasury.programacion.recurring': 'Recurrentes',
  'treasury.programacion.contracts': 'Contratos',
  'treasury.programacion.paymentPlans': 'Planes de pago',
  'treasury.datos.transactions': 'Transacciones',
  'treasury.datos.budgets': 'Presupuestos',
  'treasury.datos.statements': 'Estados financieros',
  'treasury.member.subtitle': 'Tus pagos e instrucciones',
  'treasury.member.loading': 'Cargando tus pagos…',
  'treasury.member.totalPendiente': 'Total pendiente',
  'treasury.member.totalPagado': 'Total pagado',
  'treasury.member.estadoFinanciero': 'Estado financiero',
  'treasury.member.status.moroso': 'Moroso',
  'treasury.member.status.pendiente': 'Pendiente',
  'treasury.member.status.alCorriente': 'Al corriente',
  'treasury.member.resumenComunidad': 'Resumen de la comunidad',
  'governance.title': 'Gobernanza',
  'governance.subtitle.proposals': 'Propuestas y votaciones',
  'governance.subtitle.assemblies': 'Asambleas y convocatorias',
  'governance.export': 'Exportar',
  'governance.newAssembly': 'Nueva Asamblea',
  'governance.newProposal': 'Nueva Propuesta',
  'governance.tab.proposals': 'Propuestas',
  'governance.tab.active': 'Activas',
  'governance.tab.discussion': 'En Discusion',
  'governance.tab.draft': 'Borradores',
  'governance.tab.closed': 'Cerradas',
  'governance.tab.all': 'Todas',
  'governance.tab.assemblies': 'Asambleas',
  'governance.tab.delegations': 'Delegaciones',
  'governance.tab.minutes': 'Actas',
  'governance.tab.rules': 'Reglas',
  'members.title': 'Miembros',
  'members.subtitle': 'Directorio de miembros de la comunidad',
  'members.export': 'Exportar',
  'transactions.toast.verified': 'Estado de verificacion actualizado',
  'transactions.toast.verifyError': 'Error al verificar transaccion',
  'transactions.toast.updateError': 'Error al actualizar transaccion',
  'transactions.toast.deleted': 'Transaccion eliminada',
  'transactions.toast.deleteError': 'Error al eliminar transaccion',
  'transactions.confirmDelete': 'Estas seguro de eliminar esta transaccion?',
  'transactions.filter.allTypes': 'Todos los tipos',
  'transactions.filter.income': 'Ingresos',
  'transactions.filter.expense': 'Egresos',
  'transactions.filter.from': 'Desde',
  'transactions.filter.to': 'Hasta',
  'transactions.table.date': 'Fecha',
  'transactions.table.description': 'Descripcion',
  'transactions.table.category': 'Categoria',
  'transactions.table.type': 'Tipo',
  'transactions.table.origin': 'Origen',
  'transactions.table.verification': 'Verificacion',
  'transactions.table.amount': 'Monto',
  'transactions.table.actions': 'Acciones',
  'transactions.table.loading': 'Cargando...',
  'transactions.table.empty': 'Sin transacciones. Importa datos para comenzar.',
  'transactions.edit.noCategory': 'Sin categoria',
  'transactions.edit.save': 'Guardar',
  'transactions.edit.cancel': 'Cancelar',
  'transactions.badge.income': 'Ingreso',
  'transactions.badge.expense': 'Egreso',
  'transactions.origin.rail': 'Rail',
  'transactions.origin.import': 'Importado',
  'transactions.origin.system': 'Sistema',
  'transactions.origin.manual': 'Manual',
  'transactions.verification.verified': 'Verificada',
  'transactions.verification.disputed': 'Disputada',
  'transactions.verification.reported': 'Reportada',
  'transactions.action.verify': 'Verificar',
  'transactions.action.edit': 'Editar',
  'transactions.action.delete': 'Eliminar',
  'transactions.modal.title': 'Editar transaccion',
  'obligations.summary.pending': 'Pendientes',
  'obligations.summary.overdue': 'Vencidas',
  'obligations.summary.paid': 'Pagadas',
  'obligations.filter.allStatuses': 'Todos los estados',
  'obligations.status.pending': 'Pendiente',
  'obligations.status.paid': 'Pagado',
  'obligations.status.overdue': 'Vencido',
  'obligations.status.partial': 'Parcial',
  'obligations.new': 'Nueva Obligacion',
  'obligations.table.member': 'Miembro',
  'obligations.table.concept': 'Concepto',
  'obligations.table.amount': 'Monto',
  'obligations.table.dueDate': 'Vencimiento',
  'obligations.table.status': 'Estado',
  'obligations.table.link': 'Vinculo',
  'obligations.table.actions': 'Acciones',
  'obligations.table.loading': 'Cargando...',
  'obligations.table.empty': 'Sin obligaciones de pago registradas.',
  'obligations.linkedTx': 'Tx vinculada',
  'obligations.registerPayment': 'Registrar Pago',
  'proposals.loading': 'Cargando propuestas...',
  'proposals.empty': 'No hay propuestas.',
  'proposals.status.draft': 'Borrador',
  'proposals.status.discussion': 'En Discusion',
  'proposals.status.active': 'Activa',
  'proposals.status.closed': 'Cerrada',
  'proposals.status.approved': 'Aprobada',
  'proposals.status.rejected': 'Rechazada',
  'proposals.status.executed': 'Ejecutada',
  'proposals.type.ordinary': 'Ordinaria',
  'proposals.type.extraordinary': 'Extraordinaria',
  'proposals.type.budget': 'Presupuesto',
  'proposals.type.election': 'Eleccion',
  'proposals.type.amendment': 'Enmienda',
  'proposals.meta.created': 'Creada',
  'proposals.meta.voting': 'Votacion',
  'proposals.meta.close': 'Cierre',
  'assemblies.loading': 'Cargando asambleas...',
  'assemblies.empty': 'No hay asambleas registradas.',
  'assemblies.present': 'presentes',
  'assemblies.quorumMet': 'Quorum alcanzado',
  'assemblies.status.scheduled': 'Programada',
  'assemblies.status.convened': 'Convocada',
  'assemblies.status.in_session': 'En sesion',
  'assemblies.status.first_call': '1a Llamada',
  'assemblies.status.second_call': '2a Llamada',
  'assemblies.status.third_call': '3a Llamada',
  'assemblies.status.completed': 'Completada',
  'assemblies.status.cancelled': 'Cancelada',
  'assemblies.type.ordinary': 'Ordinaria',
  'assemblies.type.extraordinary': 'Extraordinaria',
  'obligationDialog.title': 'Nueva Obligacion de Pago',
  'obligationDialog.error.required': 'Todos los campos son obligatorios',
  'obligationDialog.error.memberRequired': 'Selecciona un miembro o marca "Para todos los miembros activos"',
  'obligationDialog.error.amountPositive': 'El monto debe ser mayor a cero',
  'obligationDialog.error.amountLimit': 'El monto excede el limite permitido',
  'obligationDialog.error.noActiveMembers': 'No hay miembros activos',
  'obligationDialog.error.create': 'Error al crear obligacion',
  'obligationDialog.forAll': 'Para todos los miembros activos',
  'obligationDialog.member': 'Miembro',
  'obligationDialog.memberPlaceholder': 'Seleccionar miembro...',
  'obligationDialog.concept': 'Concepto',
  'obligationDialog.conceptPlaceholder': 'Ej: Cuota de mantenimiento enero 2025',
  'obligationDialog.amount': 'Monto',
  'obligationDialog.dueDate': 'Fecha de Vencimiento',
  'obligationDialog.cancel': 'Cancelar',
  'obligationDialog.create': 'Crear',
  'obligationDialog.creating': 'Creando...',
  'paymentDialog.title': 'Registrar Pago',
  'paymentDialog.error.register': 'Error al registrar pago',
  'paymentDialog.concept': 'Concepto',
  'paymentDialog.method': 'Metodo de Pago',
  'paymentDialog.reference': 'Referencia / Folio (opcional)',
  'paymentDialog.referencePlaceholder': 'Ej: SPEI-123456, recibo #42',
  'paymentDialog.date': 'Fecha de Pago',
  'paymentDialog.notes': 'Notas (opcional)',
  'paymentDialog.notesPlaceholder': 'Notas adicionales sobre el pago',
  'paymentDialog.info': 'Al registrar el pago se creara automaticamente una transaccion de ingreso vinculada a esta obligacion.',
  'paymentDialog.cancel': 'Cancelar',
  'paymentDialog.confirm': 'Confirmar Pago',
  'paymentDialog.registering': 'Registrando...',
  'proposalDialog.title': 'Nueva Propuesta',
  'proposalDialog.titleWithTemplate': 'Nueva Propuesta',
  'proposalDialog.noPermissionTitle': 'No puedes crear propuestas',
  'proposalDialog.selectTemplate': 'Selecciona el tipo de propuesta que quieres crear:',
  'proposalDialog.type': 'Tipo',
  'proposalDialog.error.noPermission': 'No tienes permiso para crear propuestas',
  'proposalDialog.error.titleRequired': 'El titulo es obligatorio',
  'proposalDialog.error.descriptionRequired': 'La descripcion es obligatoria',
  'proposalDialog.error.typeRequired': 'Selecciona un tipo de propuesta',
  'proposalDialog.error.quorum': 'Error en quorum. Contacta al administrador.',
  'proposalDialog.error.majority': 'Error en mayoria. Contacta al administrador.',
  'proposalDialog.error.endFuture': 'La fecha de fin de votacion debe ser en el futuro',
  'proposalDialog.error.startBeforeEnd': 'La fecha de inicio debe ser anterior a la fecha de fin',
  'proposalDialog.error.multipleChoiceMin': 'Debes agregar al menos 2 opciones para votacion de opcion multiple',
  'proposalDialog.error.fiAmount': 'El monto de la instruccion financiera debe ser mayor o igual a cero',
  'proposalDialog.error.fiNewAmount': 'El nuevo monto (cuota) debe ser mayor o igual a cero',
  'proposalDialog.error.create': 'Error al crear propuesta',
  'proposalDialog.note.election': 'Nota: Los miembros morosos no pueden ser electos para cargos de administracion (Art. 2 LPCI). Verifica el estado de pago de los candidatos.',
  'proposalDialog.quorum': 'Quorum',
  'proposalDialog.majority': 'Mayoria',
  'proposalDialog.rulesDefined': 'Definido por las reglas de tu comunidad',
  'proposalDialog.votingModel': 'Modelo de Votacion',
  'proposalDialog.voting.simple': 'Simple (A favor / En contra / Abstencion)',
  'proposalDialog.voting.consensus': 'Consenso (Acuerdo / Desacuerdo / Abstencion / Bloqueo)',
  'proposalDialog.voting.multiple': 'Opcion Multiple',
  'proposalDialog.voting.consensusHelp': 'En modelo de consenso, cualquier miembro puede bloquear una propuesta con una razon obligatoria.',
  'proposalDialog.voting.multipleHelp': 'Agrega las opciones entre las que los miembros podran elegir:',
  'proposalDialog.voting.option': 'Opcion',
  'proposalDialog.voting.addOption': 'Agregar opcion',
  'proposalDialog.discussion.title': 'Periodo de Discusion',
  'proposalDialog.discussion.include': 'Incluir periodo de discusion antes de votar',
  'proposalDialog.discussion.required': 'Obligatorio',
  'proposalDialog.discussion.duration': 'Duracion de la discusion (horas)',
  'proposalDialog.discussion.help': 'La votacion no podra abrirse hasta que termine el periodo de discusion.',
  'proposalDialog.votingStart': 'Inicio de votacion',
  'proposalDialog.votingEnd': 'Fin de votacion',
  'proposalDialog.autoExecution': 'Auto-ejecucion activa: si la propuesta se aprueba, la instruccion financiera se ejecutara automaticamente tras {hours}h de enfriamiento.',
  'proposalDialog.back': 'Atras',
  'proposalDialog.create': 'Crear Propuesta',
  'proposalDialog.creating': 'Creando...',
  'assemblyDialog.title': 'Nueva Asamblea',
  'assemblyDialog.type': 'Tipo de Asamblea',
  'assemblyDialog.type.ordinary': 'Ordinaria',
  'assemblyDialog.type.extraordinary': 'Extraordinaria',
  'assemblyDialog.titleLabel': 'Titulo',
  'assemblyDialog.titlePlaceholder': 'Ej: Asamblea Ordinaria Q1 2026',
  'assemblyDialog.date': 'Fecha y Hora',
  'assemblyDialog.noticeWarning': 'La convocatoria debe emitirse con al menos {days} dias de anticipacion (Art. 34 LPCI). La fecha seleccionada no cumple este requisito.',
  'assemblyDialog.location': 'Ubicacion',
  'assemblyDialog.locationPlaceholder': 'Ej: Salon de usos multiples, Piso 1',
  'assemblyDialog.agenda': 'Orden del Dia',
  'assemblyDialog.addItem': 'Agregar punto',
  'assemblyDialog.topicPlaceholder': 'Tema',
  'assemblyDialog.descriptionPlaceholder': 'Descripcion (opcional)',
  'assemblyDialog.error.titleRequired': 'El titulo es requerido',
  'assemblyDialog.error.dateRequired': 'La fecha es requerida',
  'assemblyDialog.error.locationRequired': 'La ubicacion es requerida',
  'assemblyDialog.error.agendaTopicRequired': 'Todos los puntos del orden del dia deben tener un tema',
  'assemblyDialog.error.create': 'Error al crear asamblea',
  'assemblyDialog.success': 'Asamblea creada exitosamente. Se genero la convocatoria automaticamente.',
  'assemblyDialog.cancel': 'Cancelar',
  'assemblyDialog.create': 'Crear Asamblea',
  'assemblyDialog.creating': 'Creando...',
  'proposalDetail.back': 'Volver',
  'proposalDetail.title': 'Detalle de Propuesta',
  'proposalDetail.notFound': 'Propuesta no encontrada.',
  'assemblyDetail.loading': 'Cargando asamblea...',
  'assemblyDetail.notFound': 'Asamblea no encontrada.',
  'assemblyDetail.backToGovernance': 'Volver a Gobernanza',
  'assemblyDetail.defaultCaller': 'Administrador',
  'assemblyDetail.actions': 'Acciones',
  'assemblyDetail.startFirstCall': 'Iniciar 1a Llamada',
  'assemblyDetail.toSecondCall': 'Pasar a 2a Llamada',
  'assemblyDetail.toThirdCall': 'Pasar a 3a Llamada',
  'assemblyDetail.startSession': 'Iniciar Sesion',
  'assemblyDetail.complete': 'Completar',
  'assemblyDetail.completeAssembly': 'Completar Asamblea',
  'assemblyDetail.cancel': 'Cancelar',
  'assemblyDetail.agenda': 'Orden del Dia',
  'assemblyDetail.calls': 'Convocatorias',
  'assemblyDetail.notes': 'Notas',
  'assemblyDetail.memberFallback': 'Miembro',
  'assemblyDetail.toast.statusUpdated': 'Estado actualizado a: {status}',
  'assemblyDetail.toast.statusError': 'Error al actualizar el estado',
  'generalFields.title': 'Titulo',
  'generalFields.titlePlaceholder': 'Titulo de la propuesta',
  'generalFields.description': 'Descripcion',
  'generalFields.descriptionPlaceholder': 'Describa la propuesta...',
  'gastoFields.fund.maintenance': 'Fondo de mantenimiento',
  'gastoFields.fund.reserve': 'Fondo de reserva',
  'gastoFields.title': 'Gasto',
  'gastoFields.conceptLabel': 'Concepto',
  'gastoFields.quotesLabel': 'Cotizaciones (URLs o referencias)',
  'gastoFields.quotesPlaceholder': 'Enlaces a cotizaciones o notas',
  'gastoFields.fundLabel': 'Fondo',
  'gastoFields.entityLabel': 'Beneficiario / Proveedor',
  'gastoFields.entityPlaceholder': 'Buscar proveedor o beneficiario...',
  'gastoFields.amountLabel': 'Monto',
  'gastoFields.amountPlaceholder': '0.00',
  'gastoFields.conceptPlaceholder': 'Descripcion del gasto',
  'gastoFields.desc.concept': 'Concepto: {value}',
  'gastoFields.desc.quotes': 'Cotizaciones o referencias:\n{value}',
  'cuotaFields.type.ordinary': 'Cuota ordinaria',
  'cuotaFields.type.extraordinary': 'Cuota extraordinaria',
  'cuotaFields.currentAmountLabel': 'Monto actual (referencia)',
  'cuotaFields.currentAmountPlaceholder': 'Opcional — monto vigente para referencia',
  'cuotaFields.newAmountLabel': 'Nuevo monto',
  'cuotaFields.effectiveDateLabel': 'Fecha de entrada en vigor',
  'cuotaFields.appliesToLabel': 'Aplica a',
  'cuotaFields.appliesToPlaceholder': 'Buscar tipo de cuota...',
  'cuotaFields.impactTitle': 'Impacto estimado',
  'cuotaFields.impactPeriod': 'periodo',
  'cuotaFields.titlePrefix': 'Cambio de cuota',
  'cuotaFields.desc.current': 'Monto actual (referencia): {currency} {value}',
  'cuotaFields.desc.new': 'Nuevo monto propuesto: {currency} {value}',
  'cuotaFields.desc.indicate': '[indicar]',
  'cuotaFields.desc.effective': 'Entrada en vigor: {value}',
  'cuotaFields.desc.applies': 'Aplica a: {value}',
  'cuotaFields.desc.impact': 'Impacto estimado ({count} miembros): {currency} {value} mensual',
  'presupuestoFields.period.monthly': 'Mensual',
  'presupuestoFields.period.quarterly': 'Trimestral',
  'presupuestoFields.period.yearly': 'Anual',
  'presupuestoFields.fund.maintenance': 'Fondo de mantenimiento',
  'presupuestoFields.fund.reserve': 'Fondo de reserva',
  'presupuestoFields.categoryLabel': 'Categoria',
  'presupuestoFields.categoryPlaceholder': 'Buscar categoria...',
  'presupuestoFields.amountLabel': 'Monto solicitado',
  'presupuestoFields.periodLabel': 'Periodo',
  'presupuestoFields.periodPlaceholder': 'Buscar periodo...',
  'presupuestoFields.fundLabel': 'Fondo',
  'presupuestoFields.fundPlaceholder': 'Buscar fondo...',
  'presupuestoFields.titlePrefix': 'Presupuesto',
  'presupuestoFields.desc.category': 'Categoria: {value}',
  'presupuestoFields.desc.amount': 'Monto solicitado: {currency} {value}',
  'presupuestoFields.desc.period': 'Periodo: {value}',
  'presupuestoFields.desc.fund': 'Fondo: {value}',
  'cambioReglaFields.ruleLabel': 'Regla a modificar',
  'cambioReglaFields.rulePlaceholder': 'Buscar regla que quieres cambiar...',
  'cambioReglaFields.newValueLabel': 'Nuevo valor propuesto',
  'cambioReglaFields.newValuePlaceholder': 'Ej: {current} -> nuevo valor',
  'cambioReglaFields.justificationLabel': 'Justificacion legal / motivo del cambio',
  'cambioReglaFields.justificationPlaceholder': 'Explicar por que es necesario el cambio y, si aplica, referencia normativa.',
  'cambioReglaFields.description.propose': 'Propongo cambiar la regla "{label}".',
  'cambioReglaFields.titlePrefix': 'Cambio de regla',
  'cambioReglaFields.description.current': 'Valor actual: {value}',
  'cambioReglaFields.description.new': 'Nuevo valor propuesto: {value}',
  'cambioReglaFields.description.complete': '[completar]',
  'cambioReglaFields.description.justification': 'Justificacion: {value}',
  'cambioReglaFields.description.justificationPlaceholder': 'Justificacion: [explicar por que es necesario el cambio]',
  'rulePicker.noResults': 'No se encontraron reglas',
  'rulePicker.currentValue': 'Valor actual:',
  'searchableSelect.placeholder': 'Buscar o seleccionar...',
  'searchableSelect.empty': 'Sin resultados',
  'categoryPicker.label': 'Categoria',
  'categoryPicker.placeholder': 'Buscar categoria...',
  'categoryPicker.noResults': 'Sin resultados',
  'categoryPicker.loading': 'Cargando...',
  'entityPicker.placeholder': 'Buscar proveedor o beneficiario...',
  'entityPicker.label': 'Beneficiario',
  'entityPicker.type.provider': 'Proveedor',
  'entityPicker.type.contractor': 'Contratista',
  'entityPicker.type.partner': 'Socio Comercial',
  'entityPicker.type.other': 'Otro',
  'entityPicker.createNew': 'Crear nuevo proveedor',
  'entityPicker.newProvider': 'Nuevo proveedor',
  'entityPicker.cancel': 'Cancelar',
  'entityPicker.namePlaceholder': 'Nombre del proveedor',
  'entityPicker.phonePlaceholder': 'Telefono (opcional)',
  'entityPicker.errorCreate': 'Error al crear el proveedor',
  'entityPicker.creating': 'Creando...',
  'entityPicker.createAndSelect': 'Crear y seleccionar',
  'eleccionFields.role.admin': 'Administrador',
  'eleccionFields.role.vigilance': 'Comite de vigilancia',
  'eleccionFields.role.treasurer': 'Tesorero',
  'eleccionFields.titlePrefix': 'Eleccion',
  'eleccionFields.desc.role': 'Cargo: {value}',
  'eleccionFields.desc.period': 'Periodo: {value}',
  'eleccionFields.desc.candidates': 'Candidatos: {value}',
  'eleccionFields.desc.warning': 'Aviso: Los miembros morosos no son elegibles segun el reglamento.',
  'eleccionFields.roleLabel': 'Cargo a elegir',
  'eleccionFields.rolePlaceholder': 'Buscar cargo...',
  'eleccionFields.candidatesLabel': 'Candidatos',
  'eleccionFields.add': 'Anadir',
  'eleccionFields.candidatePlaceholder': 'Candidato {index}',
  'eleccionFields.removeCandidate': 'Quitar candidato',
  'eleccionFields.periodLabel': 'Periodo del cargo',
  'eleccionFields.periodPlaceholder': 'Ej: 2025-2026, 12 meses',
  'eleccionFields.includeWarning': 'Incluir aviso: morosos no elegibles',
  'emergenciaFields.titlePrefix': 'Gasto de emergencia',
  'emergenciaFields.desc.intro': 'Propuesta de gasto por emergencia.',
  'emergenciaFields.desc.beneficiary': 'Beneficiario: {value}',
  'emergenciaFields.desc.amount': 'Monto estimado: {currency} {value}',
  'emergenciaFields.desc.evidence': 'Evidencia (fotos/URLs):\n{value}',
  'emergenciaFields.desc.justification': 'Justificacion de la emergencia:\n{value}',
  'emergenciaFields.alert': 'Esta propuesta es para un gasto de urgencia. Incluya evidencia y justificacion.',
  'emergenciaFields.beneficiaryLabel': 'Beneficiario / Proveedor',
  'emergenciaFields.beneficiaryPlaceholder': 'Buscar proveedor o beneficiario...',
  'emergenciaFields.amountLabel': 'Monto estimado',
  'emergenciaFields.evidenceLabel': 'Evidencia (fotos o URLs)',
  'emergenciaFields.evidencePlaceholder': 'Enlaces a fotos, reportes o documentos que respalden la emergencia',
  'emergenciaFields.justificationLabel': 'Justificacion de la emergencia',
  'emergenciaFields.justificationPlaceholder': 'Por que se considera urgente y no puede esperar al proceso ordinario',
  'obraFields.titlePrefix': 'Obra',
  'obraFields.desc.contractor': 'Contratista: {value}',
  'obraFields.desc.total': 'Monto total: {currency} {value}',
  'obraFields.desc.duration': 'Duracion estimada: {value}',
  'obraFields.desc.schedule': 'Cronograma de pagos:\n{value}',
  'obraFields.desc.quotes': 'Cotizaciones (min. {min}):\n{value}',
  'obraFields.desc.noValue': '—',
  'obraFields.desc.scheduleFallback': 'Ver cronograma',
  'obraFields.contractorLabel': 'Contratista',
  'obraFields.contractorPlaceholder': 'Buscar contratista...',
  'obraFields.totalLabel': 'Monto total',
  'obraFields.durationLabel': 'Duracion estimada',
  'obraFields.durationPlaceholder': 'Ej: 3 meses, 90 dias',
  'obraFields.scheduleLabel': 'Cronograma de pagos',
  'obraFields.phase': 'Fase',
  'obraFields.phasePlaceholder': 'Fase / concepto',
  'obraFields.amountPlaceholder': 'Monto',
  'obraFields.datePlaceholder': 'Fecha',
  'obraFields.removeRow': 'Quitar fila',
  'obraFields.quotesLabel': 'Cotizaciones (minimo {min})',
  'obraFields.quotesPlaceholder': 'Una por linea o separadas por coma',
  'obraFields.quotesWarning': 'Se recomienda al menos {min} cotizaciones. Actual: {count}.',
  'admisionFields.doc.id': 'Identificacion oficial',
  'admisionFields.doc.address': 'Comprobante de domicilio',
  'admisionFields.doc.signedRequest': 'Solicitud de admision firmada',
  'admisionFields.doc.others': 'Otros documentos',
  'admisionFields.titlePrefix': 'Admision',
  'admisionFields.desc.candidate': 'Candidato: {value}',
  'admisionFields.desc.email': 'Email (invitacion): {value}',
  'admisionFields.desc.unit': 'Unidad / Departamento: {value}',
  'admisionFields.desc.docs': 'Documentacion presentada:',
  'admisionFields.desc.docLine': '- {label}: {value}',
  'admisionFields.yes': 'Si',
  'admisionFields.no': 'No',
  'admisionFields.candidateLabel': 'Nombre del candidato',
  'admisionFields.candidatePlaceholder': 'Nombre completo',
  'admisionFields.emailLabel': 'Email (para invitacion)',
  'admisionFields.emailPlaceholder': 'correo@ejemplo.com',
  'admisionFields.unitLabel': 'Unidad / Departamento',
  'admisionFields.unitPlaceholder': 'Opcional',
  'admisionFields.docsLabel': 'Documentacion presentada',
  'proposalDetail.loading': 'Cargando propuesta...',
  'proposalDetail.notFoundAccess': 'Propuesta no encontrada o no tienes acceso.',
  'proposalDetail.backToGovernance': 'Volver a Gobernanza',
  'proposalDetail.status.draft': 'Borrador',
  'proposalDetail.status.discussion': 'En Discusion',
  'proposalDetail.status.active': 'Votacion Activa',
  'proposalDetail.status.closed': 'Cerrada',
  'proposalDetail.status.approved': 'Aprobada',
  'proposalDetail.status.rejected': 'Rechazada',
  'proposalDetail.status.executed': 'Ejecutada',
  'proposalDetail.countdown.expired': 'Expirado',
  'proposalDetail.countdown.time': 'Tiempo',
  'proposalDetail.countdown.timeLeft': 'Tiempo restante',
  'proposalDetail.badge.appealed': 'Apelada',
  'proposalDetail.meta.by': 'Por',
  'proposalDetail.meta.created': 'Creada',
  'proposalDetail.meta.discussion': 'Discusion',
  'proposalDetail.meta.votingStart': 'Inicio votacion',
  'proposalDetail.meta.close': 'Cierre',
  'proposalDetail.meta.quorum': 'Quorum',
  'proposalDetail.meta.majority': 'Mayoria',
  'proposalDetail.model.consensus': 'Consenso',
  'proposalDetail.model.multiple': 'Opcion multiple',
  'proposalDetail.closed': 'Cerrada',
  'proposalDetail.method': 'Metodo',
  'proposalDetail.method.autoClose': 'Cierre automatico',
  'proposalDetail.countdown.discussion': 'Discusion',
  'proposalDetail.countdown.voting': 'Votacion',
  'proposalDetail.countdown.appeal': 'Periodo de apelacion',
  'proposalDetail.appealedPaused': 'Esta propuesta fue apelada — la ejecucion automatica esta pausada',
  'proposalDetail.discussionHours': 'Horas de discusion',
  'proposalDetail.starting': 'Iniciando...',
  'proposalDetail.startDiscussion': 'Iniciar Discusion',
  'proposalDetail.votingClose': 'Cierre de votacion',
  'proposalDetail.opening': 'Abriendo...',
  'proposalDetail.openVoting': 'Abrir Votacion',
  'proposalDetail.openDirectVoting': 'Abrir Votacion Directa',
  'proposalDetail.closeVoting': 'Cerrar Votacion',
  'proposalDetail.appealing': 'Apelando...',
  'proposalDetail.appealProposal': 'Apelar Propuesta',
  'proposalDetail.outcomeTitle': 'Declaracion de Resultado',
  'proposalDetail.outcomeDeclared': 'Resultado declarado:',
  'proposalDetail.outcomeDeclaredAt': 'Declarado el',
  'proposalDetail.outcomePlaceholder': 'Describe el resultado oficial de esta propuesta...',
  'proposalDetail.declaring': 'Declarando...',
  'proposalDetail.declareOutcome': 'Declarar Resultado',
  'proposalDetail.cancel': 'Cancelar',
  'proposalDetail.voteRegistered': 'Voto registrado',
  'proposalDetail.voteError': 'Error al registrar voto',
  'proposalDetail.toast.discussionStarted': 'Periodo de discusion iniciado',
  'proposalDetail.toast.discussionError': 'Error al iniciar discusion',
  'proposalDetail.toast.votingOpened': 'Votacion abierta',
  'proposalDetail.toast.votingOpenError': 'Error al abrir votacion',
  'proposalDetail.toast.outcomeDeclared': 'Resultado declarado',
  'proposalDetail.toast.outcomeError': 'Error al declarar resultado',
  'proposalDetail.toast.appealed': 'Propuesta apelada — ejecucion pausada',
  'proposalDetail.toast.appealError': 'Error al apelar',
  'proposalDetail.financialInstruction': 'Instruccion Financiera',
  'proposalDetail.fi.type': 'Tipo',
  'proposalDetail.fi.amount': 'Monto',
  'proposalDetail.fi.newAmount': 'Nuevo monto',
  'proposalDetail.fi.description': 'Descripcion',
  'proposalDetail.fi.period': 'Periodo',
  'proposalDetail.fi.effectiveDate': 'Fecha efectiva',
  'proposalDetail.fi.beneficiary': 'Beneficiario',
  'proposalDetail.fi.config': 'Configuracion',
  'proposalDetail.fi.type.disbursement': 'Desembolso',
  'proposalDetail.fi.type.budgetAllocation': 'Asignacion Presupuestal',
  'proposalDetail.fi.type.quotaChange': 'Cambio de Cuota',
  'proposalDetail.fi.type.configChange': 'Cambio de Configuracion',
  'proposalDetail.fi.type.none': 'Sin instruccion',
  'proposalDetail.executedAt': 'Ejecutada el',
  'proposalDetail.executionPausedByAppeal': 'Ejecucion pausada por apelacion',
  'proposalDetail.cooldownRunning': 'Periodo de enfriamiento — se auto-ejecutara el {date}',
  'proposalDetail.cooldownComplete': 'Periodo de enfriamiento completado — lista para ejecutar',
  'proposalDetail.executeNow': 'Ejecutar Ahora',
  'proposalDetail.executing': 'Ejecutando...',
  'proposalDetail.executionFailed': 'La ejecucion fallo — puedes reintentar',
  'proposalDetail.retrying': 'Reintentando...',
  'proposalDetail.retryExecution': 'Reintentar Ejecucion',
  'proposalDetail.executeManually': 'Ejecutar Manualmente',
  'attendance.title': 'Control de Asistencia',
  'attendance.presentCount': '{present}/{total} presentes',
  'attendance.indiviso': '{pct}% indiviso',
  'attendance.searchPlaceholder': 'Buscar miembro...',
  'attendance.markAll': 'Marcar todos',
  'attendance.saving': 'Guardando...',
  'attendance.save': 'Guardar',
  'attendance.weight': '{value}% peso',
  'attendance.toast.saved': 'Asistencia registrada exitosamente',
  'attendance.toast.error': 'Error al registrar asistencia',
  'convocatoria.title': 'Convocatoria - {call}a Llamada',
  'convocatoria.badge.noticeValid': 'Aviso valido',
  'convocatoria.badge.noticeInsufficient': 'Aviso insuficiente',
  'convocatoria.typeLabel': 'Tipo de Asamblea:',
  'convocatoria.locationLabel': 'Ubicacion:',
  'convocatoria.locationMissing': 'No especificada',
  'convocatoria.dateLabel': 'Fecha y Hora:',
  'convocatoria.calledByLabel': 'Convocado por:',
  'convocatoria.calledByDefault': 'Administrador',
  'convocatoria.issuedLabel': 'Fecha de emision:',
  'convocatoria.noticeLabel': 'Aviso minimo:',
  'convocatoria.noticeValue': '{days} dias ({required} requeridos)',
  'convocatoria.agenda': 'Orden del Dia',
  'convocatoria.notificationsDelivered': '{count} notificaciones entregadas',
  'proxy.title': 'Representacion (Proxies)',
  'proxy.activeCount': '{count} representaciones activas',
  'proxy.rulesTitle': 'Art. 36 LPCI CDMX - Reglas de Representacion:',
  'proxy.rule.1': 'Cada condomino puede designar un representante',
  'proxy.rule.2': 'Un representante no puede representar a mas de 2 condominos',
  'proxy.rule.3': 'El administrador no puede actuar como representante',
  'proxy.loading': 'Cargando representaciones...',
  'proxy.activeList': 'Representaciones activas:',
  'proxy.maxReached': 'Max. alcanzado',
  'proxy.revoke': 'Revocar representacion',
  'proxy.empty': 'No hay representaciones activas para esta asamblea.',
  'proxy.grant': 'Otorgar representacion',
  'proxy.grantorPlaceholder': 'Condomino que delega...',
  'proxy.representativePlaceholder': 'Representante...',
  'proxy.representationsCount': '({count}/2 representaciones)',
  'proxy.granting': 'Otorgando...',
  'proxy.grantButton': 'Otorgar',
  'proxy.noRepresentatives': 'No hay representantes disponibles. Todos los condominos ya representan a 2 personas o son administradores.',
  'proxy.toast.granted': 'Representacion otorgada exitosamente',
  'proxy.toast.grantError': 'Error al otorgar representacion',
  'proxy.toast.revoked': 'Representacion revocada',
  'proxy.toast.revokeError': 'Error al revocar representacion',
  'votingPanel.title': 'Tu Voto',
  'votingPanel.toast.success': 'Voto registrado',
  'votingPanel.toast.error': 'Error al registrar voto',
  'votingPanel.voiceOnly': 'Tienes derecho a voz en la asamblea pero no a voto.',
  'votingPanel.alreadyVoted': 'Ya votaste:',
  'votingPanel.canChange': 'Puedes cambiar tu voto.',
  'votingPanel.yes': 'A favor',
  'votingPanel.no': 'En contra',
  'votingPanel.abstain': 'Abstencion',
  'multipleChoice.title': 'Votacion Multiple',
  'multipleChoice.myVote': 'Tu voto:',
  'multipleChoice.votesCount': '{count} votos',
  'multipleChoice.totalVotes': '{count} votos emitidos',
  'consensus.option.agree': 'De acuerdo',
  'consensus.option.disagree': 'En desacuerdo',
  'consensus.option.abstain': 'Abstencion',
  'consensus.option.block': 'Bloquear',
  'consensus.blocked': 'Bloqueada',
  'consensus.myVote': 'Tu voto:',
  'consensus.reason': 'Razon',
  'consensus.blockWarning': 'Bloquear detiene la propuesta. Explica tu razon:',
  'consensus.blockPlaceholder': 'Razon del bloqueo (obligatorio)...',
  'consensus.confirmBlock': 'Confirmar Bloqueo',
  'consensus.cancel': 'Cancelar',
  'consensus.agree': 'Acuerdo',
  'consensus.disagree': 'Desacuerdo',
  'consensus.abstain': 'Abstencion',
  'consensus.block': 'Bloqueo',
  'consensus.blockReasons': 'Razones de bloqueo:',
  'lifecycle.draft': 'Borrador',
  'lifecycle.discussion': 'Discusion',
  'lifecycle.voting': 'Votacion',
  'lifecycle.result': 'Resultado',
  'lifecycle.executed': 'Ejecutada',
  'delegation.title': 'Delegaciones',
  'delegation.votingFor': 'Votas en nombre de {count} miembro(s)',
  'delegation.toMe': 'Te delegaron su voto:',
  'delegation.you': 'Tu',
  'delegation.myDelegation': 'Tu voto delegado a:',
  'delegation.revoke': 'Revocar',
  'delegation.placeholder': 'Delegar mi voto a...',
  'delegation.delegate': 'Delegar',
  'delegation.empty': 'No hay delegaciones activas.',
  'delegation.toast.created': 'Delegacion creada exitosamente',
  'delegation.toast.createError': 'Error al crear delegacion',
  'delegation.toast.revoked': 'Delegacion revocada',
  'delegation.toast.revokeError': 'Error al revocar delegacion',
  'minutes.title': 'Acta de Votacion',
  'minutes.approved': 'Aprobada',
  'minutes.approvedAt': 'Aprobada el',
  'minutes.signatures': 'Firmas ({count}):',
  'minutes.role.secretary': 'Secretario',
  'minutes.role.committee': 'Comite Vigilancia',
  'minutes.memberFallback': 'Miembro',
  'minutes.approving': 'Aprobando...',
  'minutes.approve': 'Aprobar Acta',
  'minutes.signing': 'Firmando...',
  'minutes.sign': 'Firmar Acta',
  'minutes.alreadySigned': 'Ya firmaste',
  'minutes.description': 'Genera el acta automatica con los resultados de la votacion.',
  'minutes.generating': 'Generando...',
  'minutes.generate': 'Generar Acta',
  'votingViz.title': 'Resultados de Votacion',
  'votingViz.multipleTitle': 'Resultados de Votacion Multiple',
  'votingViz.weight': '{count} pesos',
  'votingViz.votes': '{count} votos',
  'votingViz.participation': 'Participacion',
  'votingViz.quorum': 'Quorum',
  'votingViz.majority': 'Mayoria',
  'votingViz.reached': 'Alcanzado',
  'votingViz.notReached': 'No alcanzado',
  'votingViz.notReachedF': 'No alcanzada',
  'votingViz.totalVotes': 'Total votos',
  'delivery.status.delivered': 'Entregadas',
  'delivery.status.sent': 'Enviadas',
  'delivery.status.pending': 'Pendientes',
  'delivery.status.failed': 'Fallidas',
  'delivery.loading': 'Cargando estado de entrega...',
  'delivery.empty': 'No hay notificaciones para rastrear.',
  'delivery.title': 'Estado de Entrega',
  'delivery.rate': 'Tasa de entrega',
  'assemblyDetail.status.scheduled': 'Programada',
  'assemblyDetail.status.convened': 'Convocada',
  'assemblyDetail.status.inSession': 'En sesion',
  'assemblyDetail.status.firstCall': '1a Llamada',
  'assemblyDetail.status.secondCall': '2a Llamada',
  'assemblyDetail.status.thirdCall': '3a Llamada',
  'assemblyDetail.status.completed': 'Completada',
  'assemblyDetail.status.cancelled': 'Cancelada',
  'assemblyDetail.type.ordinary': 'Ordinaria',
  'assemblyDetail.type.extraordinary': 'Extraordinaria',
  'assemblyDetail.statusUpdated': 'Estado actualizado: {status}',
  'assemblyDetail.statusUpdateError': 'Error al actualizar estado',
  'assemblyDetail.action.startFirst': 'Iniciar 1a Llamada',
  'assemblyDetail.action.cancel': 'Cancelar',
  'assemblyDetail.action.toSecond': 'Avanzar a 2a Llamada',
  'assemblyDetail.action.startSession': 'Iniciar Sesion',
  'assemblyDetail.action.toThird': 'Avanzar a 3a Llamada',
  'assemblyDetail.action.complete': 'Completar Asamblea',
  'assemblyDetail.quorumMet': 'Quorum alcanzado',
  'assemblyDetail.noLocation': 'Sin ubicacion',
  'assemblyDetail.calledBy': 'Convocado por',
  'assemblyDetail.callerDefault': 'Administrador',
  'context.ruleChange.title': 'Cambio de Reglamento',
  'context.currentValue': 'Valor actual',
  'context.proposedValue': 'Valor propuesto',
  'context.key': 'Clave',
  'context.current': 'Actual',
  'context.proposed': 'Propuesto',
  'context.noRuleDetail': 'Sin detalle de regla especificado.',
  'context.viewRules': 'Ver Reglamento Completo',
  'context.disbursement': 'Desembolso',
  'context.emergencyExpense': 'Gasto de Emergencia',
  'context.majorWork': 'Obra / Mantenimiento Mayor',
  'context.amount': 'Monto',
  'context.currentBalance': 'Balance actual',
  'context.impact': 'Impacto',
  'context.moreThanHalf': 'Mas del 50% del balance',
  'context.category': 'Categoria',
  'context.beneficiary': 'Beneficiario',
  'context.viewEntity': 'Ver entidad',
  'context.viewTreasury': 'Ver Tesoreria',
  'context.quotaChange': 'Cambio de Cuota',
  'context.newFee': 'Nueva cuota',
  'context.activeMembers': 'Miembros activos',
  'context.monthlyCollection': 'Recaudacion mensual',
  'context.effectiveDate': 'Fecha efectiva',
  'context.quotaExecuteWarning': 'Al ejecutarse, se generara una obligacion de pago para cada miembro activo.',
  'context.viewCollection': 'Ver Cobranza',
  'context.budgetAllocation': 'Asignacion de Presupuesto',
  'context.assignedAmount': 'Monto asignado',
  'context.period': 'Periodo',
  'context.viewBudgets': 'Ver Presupuestos',
  'context.memberAdmission': 'Admision de Miembro',
  'context.memberAdmissionDescription': 'Esta propuesta requiere aprobacion de la asamblea para admitir un nuevo miembro a la comunidad.',
  'context.memberAdmissionWarning': 'Una vez aprobada, el administrador debera enviar la invitacion manualmente desde la seccion de Miembros.',
  'context.viewMembers': 'Ver Miembros',
  'context.electionTitle': 'Eleccion de Mesa Directiva',
  'context.electionDescription': 'Proceso electoral para elegir cargos administrativos de la comunidad.',
  'context.currentRoles': 'Cargos actuales',
  'context.periodN': 'Periodo #{n}',
  'context.electionLegal': 'Art. 42-46 LPCI CDMX — Los morosos no pueden ser electos para cargos administrativos.',
  'context.viewAdminTerms': 'Ver Terminos Administrativos',
  'invite.title': 'Invitar Miembro',
  'invite.description': 'Envia una invitacion por correo electronico para unirse a la comunidad.',
  'invite.sent': 'Invitacion enviada',
  'invite.sentDescription': 'Se envio un correo de invitacion a',
  'invite.emailSent': 'Correo de invitacion enviado',
  'invite.linkLabel': 'Enlace de invitacion',
  'invite.copyLink': 'Copiar enlace',
  'invite.close': 'Cerrar',
  'invite.emailLabel': 'Correo electronico',
  'invite.roleLabel': 'Rol',
  'invite.emailRequired': 'El correo electronico es obligatorio',
  'invite.emailInvalid': 'Introduce un correo electronico valido',
  'invite.errorGeneric': 'Error al enviar invitacion',
  'invite.cancel': 'Cancelar',
  'invite.send': 'Enviar Invitacion',
  'invite.sending': 'Enviando...',
  'memberDir.searchPlaceholder': 'Buscar por nombre, correo o rol...',
  'memberDir.allRoles': 'Todos los roles',
  'memberDir.allStatuses': 'Todos los estados',
  'memberDir.statusActive': 'Activo',
  'memberDir.statusInactive': 'Inactivo',
  'memberDir.statusPending': 'Pendiente',
  'memberDir.invite': 'Invitar Miembro',
  'memberDir.loading': 'Cargando miembros...',
  'memberDir.empty': 'No hay miembros registrados',
  'memberDir.col.member': 'Miembro',
  'memberDir.col.email': 'Correo',
  'memberDir.col.role': 'Rol',
  'memberDir.col.status': 'Estado',
  'memberDir.col.standing': 'Standing',
  'memberDir.col.since': 'Desde',
  'memberDir.col.actions': 'Acciones',
  'memberDir.noName': 'Sin nombre',
  'memberDir.active': 'Activo',
  'memberDir.deactivate': 'Desactivar miembro',
  'memberDir.reactivate': 'Reactivar miembro',
  'memberDir.roleUpdated': 'Rol actualizado',
  'memberDir.roleError': 'Error al actualizar rol',
  'memberDir.deactivated': 'Miembro desactivado',
  'memberDir.deactivateError': 'Error al desactivar miembro',
  'memberDir.reactivated': 'Miembro reactivado',
  'memberDir.reactivateError': 'Error al reactivar miembro',
  // Page titles & subtitles
  'announcements.title': 'Anuncios',
  'announcements.subtitle': 'Avisos y comunicados de la comunidad',
  'calendar.title': 'Calendario',
  'calendar.subtitle': 'Asambleas, pagos y propuestas en un solo lugar',
  'calendar.today': 'Hoy',
  'calendar.eventsFor': 'Eventos de',
  'calendar.noEvents': 'Sin eventos',
  'documents.title': 'Documentos',
  'documents.subtitle': 'Gestión documental de la comunidad',
  'documents.upload': 'Subir Documento',
  'documents.communityDocs': 'Documentos de la comunidad',
  'documents.searchPlaceholder': 'Buscar documentos...',
  'documents.loading': 'Cargando documentos...',
  'documents.noResults': 'Sin resultados para tu búsqueda',
  'documents.empty': 'No hay documentos aún',
  'documents.noResultsHint': 'Intenta con otro término',
  'documents.emptyHint': 'Sube el primero con el botón de arriba',
  'profile.title': 'Mi Perfil',
  'profile.subtitle': 'Gestiona tu cuenta y preferencias',
  'profile.personalInfo': 'Información Personal',
  'profile.fullName': 'Nombre completo',
  'profile.email': 'Correo electrónico',
  'profile.emailHint': 'El correo electrónico no se puede cambiar',
  'profile.saveChanges': 'Guardar cambios',
  'profile.saving': 'Guardando...',
  'profile.nameUpdated': 'Nombre actualizado exitosamente',
  'profile.changePassword': 'Cambiar Contraseña',
  'profile.newPassword': 'Nueva contraseña',
  'profile.confirmPassword': 'Confirmar nueva contraseña',
  'profile.updatePassword': 'Actualizar contraseña',
  'profile.updating': 'Actualizando...',
  'profile.passwordUpdated': 'Contraseña actualizada exitosamente',
  'profile.myCommunities': 'Mis Comunidades',
  'profile.noCommunities': 'No perteneces a ninguna comunidad aún.',
  'profile.switchTo': 'Cambiar a esta',
  'profile.current': 'Actual',
  'profile.activitySummary': 'Resumen de Actividad',
  'profile.roleInCommunity': 'Rol en la comunidad actual',
  'profile.financialStatus': 'Estado financiero',
  'profile.votingWeight': 'Peso de voto',
  'profile.memberSince': 'Miembro desde',
  'profile.dataPrivacy': 'Datos y Privacidad',
  'settings.subtitle': 'Nombre, reglas, categorías e invitaciones',
  'settings.tab.notifications': 'Notificaciones',
  'settings.tab.audit': 'Auditoría',
  'settings.categories.title': 'Gestión de Categorías',
  'settings.invitations.title': 'Invitaciones Pendientes',
  'settings.invitations.create': 'Crear invitación',
  'settings.invitations.empty': 'No hay invitaciones pendientes.',
  'settings.backToPanel': 'Volver al panel',
  'governance.subtitle.delegations': 'Gestiona las delegaciones de voto entre miembros',
  'governance.subtitle.minutes': 'Actas generadas a partir de propuestas ejecutadas',
  'governance.subtitle.rules': 'Reglamento vigente de la comunidad',
  'governance.loadingMember': 'Cargando información de miembro...',
  'community.directory.members': 'Miembros',
  'community.directory.providers': 'Proveedores',
  'residential.title': 'Residencial',
  'residential.subtitle': 'Unidades, mantenimiento, áreas comunes y reservaciones',
  'memberDetail.title': 'Detalle de Miembro',
  'memberDetail.back': 'Volver a Comunidad',
  'memberDetail.loading': 'Cargando perfil del miembro...',
  'memberDetail.notFound': 'Miembro no encontrado',
  'entityDetail.title': 'Detalle de Entidad',
  'common.notFound': 'No encontrado',
  // Announcements, auth, contracts, deliberation, entities, recurring, treasury
  'announcements.confirmDelete': '¿Eliminar este anuncio?',
  'announcements.deleted': 'Anuncio eliminado',
  'announcements.edit': 'Editar Anuncio',
  'announcements.empty': 'Sin anuncios publicados.',
  'announcements.errorDeleting': 'Error al eliminar',
  'announcements.errorSaving': 'Error al guardar anuncio',
  'announcements.expires': 'Expira',
  'announcements.expiresOptional': 'Expira (opcional)',
  'announcements.message': 'Mensaje',
  'announcements.new': 'Nuevo Anuncio',
  'announcements.pin': 'Fijar',
  'announcements.pinToTop': 'Fijar en la parte superior',
  'announcements.priority': 'Prioridad',
  'announcements.priority.low': 'Baja',
  'announcements.priority.normal': 'Normal',
  'announcements.priority.urgent': 'Urgente',
  'announcements.publish': 'Publicar',
  'announcements.publishFirst': 'Publicar el primero',
  'announcements.published': 'Anuncio publicado',
  'announcements.publishedCount': 'anuncios publicados',
  'announcements.unpin': 'Desfijar',
  'announcements.updated': 'Anuncio actualizado',
  'auth.forgotPassword.backToLogin': 'Volver al inicio de sesión',
  'auth.forgotPassword.checkEmail': 'Revisa tu correo',
  'auth.forgotPassword.checkInbox': 'Revisa tu bandeja de entrada y la carpeta de spam.',
  'auth.forgotPassword.ifAccountExists': 'Si existe una cuenta con ',
  'auth.forgotPassword.linkExpiry': 'El enlace expirará en 1 hora por seguridad.',
  'auth.forgotPassword.sendAgain': 'Enviar de nuevo',
  'auth.forgotPassword.sendResetLink': 'Enviar enlace de recuperación',
  'auth.forgotPassword.subtitle': 'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.',
  'auth.forgotPassword.title': 'Recuperar Contraseña',
  'auth.forgotPassword.willReceiveLink': ', recibirás un enlace para restablecer tu contraseña.',
  'auth.invite.acceptError': 'Error al aceptar la invitación',
  'auth.invite.acceptInvitation': 'Aceptar invitación',
  'auth.invite.acceptedRedirecting': 'Has aceptado la invitación. Redirigiendo al dashboard...',
  'auth.invite.accepting': 'Aceptando...',
  'auth.invite.asRole': 'como',
  'auth.invite.createAccount': 'Crear cuenta',
  'auth.invite.createOrLogin': 'Crea una cuenta o inicia sesión para aceptar.',
  'auth.invite.goHome': 'Ir al inicio',
  'auth.invite.invalidDesc': 'Esta invitación ha expirado, ya fue utilizada o no existe.',
  'auth.invite.invalidTitle': 'Invitación no válida',
  'auth.invite.invitedAsRole': 'Has sido invitado como',
  'auth.invite.invitedEmail': 'Invitado a:',
  'auth.invite.invitedTo': 'Te han invitado a',
  'auth.invite.invitedWithRole': 'Se te ha invitado con el rol de',
  'auth.invite.pendingTitle': 'Invitación pendiente',
  'auth.invite.signIn': 'Iniciar sesión',
  'auth.invite.verifyError': 'No se pudo verificar la invitación',
  'auth.invite.verifying': 'Verificando invitación...',
  'auth.invite.welcome': 'Bienvenido',
  'auth.invite.withRole': 'con el rol de',
  'auth.invite.youAreInvited': 'Has sido invitado',
  'auth.login.error': 'Credenciales inválidas',
  'auth.login.forgotPassword': '¿Olvidaste tu contraseña?',
  'auth.login.inviteMessage': 'Tienes una invitación pendiente. Inicia sesión para aceptarla.',
  'auth.login.noAccount': '¿No tienes cuenta?',
  'auth.login.signUp': 'Regístrate',
  'auth.login.signingIn': 'Ingresando...',
  'auth.login.subtitle': 'Ingresa a tu cuenta',
  'auth.login.title': 'Iniciar Sesión',
  'auth.register.checkEmail': '¡Revisa tu correo!',
  'auth.register.confirmToAccess': 'Confirma tu correo electrónico para acceder a tu cuenta.',
  'auth.register.confirmationSent': 'Te hemos enviado un correo de confirmación a',
  'auth.register.error': 'Error al registrar',
  'auth.register.fullName': 'Nombre completo',
  'auth.register.goToLogin': 'Ir a inicio de sesión',
  'auth.register.hasAccount': '¿Ya tienes cuenta?',
  'auth.register.minChars': 'Mínimo 6 caracteres',
  'auth.register.registering': 'Registrando...',
  'auth.register.signIn': 'Inicia sesión',
  'auth.register.subtitle': 'Crea tu cuenta para comenzar',
  'auth.register.title': 'Crear Cuenta',
  'auth.resetPassword.backToLogin': 'Volver al login',
  'auth.resetPassword.confirmPassword': 'Confirmar contraseña',
  'auth.resetPassword.enterNewPassword': 'Ingresa tu nueva contraseña',
  'auth.resetPassword.invalidLink': 'Enlace inválido',
  'auth.resetPassword.invalidLinkDesc': 'Este enlace de recuperación no es válido o ha expirado.',
  'auth.resetPassword.linksExpire': 'Los enlaces de recuperación expiran después de 1 hora.',
  'auth.resetPassword.newPassword': 'Nueva contraseña',
  'auth.resetPassword.passwordsMatch': 'Las contraseñas coinciden',
  'auth.resetPassword.passwordsNoMatch': 'Las contraseñas no coinciden',
  'auth.resetPassword.repeatPassword': 'Repetir contraseña',
  'auth.resetPassword.req.lowercase': 'Una minúscula',
  'auth.resetPassword.req.minChars': 'Mínimo 8 caracteres',
  'auth.resetPassword.req.number': 'Un número',
  'auth.resetPassword.req.uppercase': 'Una mayúscula',
  'auth.resetPassword.requestNewLink': 'Solicitar nuevo enlace',
  'auth.resetPassword.requirementsNotMet': 'La contraseña no cumple los requisitos',
  'auth.resetPassword.strength.fair': 'Regular',
  'auth.resetPassword.strength.good': 'Buena',
  'auth.resetPassword.strength.strong': 'Fuerte',
  'auth.resetPassword.strength.weak': 'Débil',
  'auth.resetPassword.strengthLabel': 'Fortaleza:',
  'auth.resetPassword.subtitle': 'Establece tu nueva contraseña',
  'auth.resetPassword.successDesc': 'Tu contraseña ha sido actualizada correctamente.',
  'auth.resetPassword.successTitle': '¡Contraseña actualizada!',
  'auth.resetPassword.title': 'Restablecer Contraseña',
  'auth.resetPassword.updateError': 'Error al actualizar contraseña',
  'auth.resetPassword.updatePassword': 'Actualizar contraseña',
  'auth.resetPassword.updating': 'Actualizando...',
  'auth.resetPassword.validatingRequest': 'Validando solicitud...',
  'auth.resetPassword.verifyingLink': 'Verificando enlace de recuperación...',
  'contracts.action': 'Acción',
  'contracts.activeContracts': 'Contratos activos',
  'contracts.allStatuses': 'Todos los estados',
  'contracts.approvedByProposal': 'Aprobado por propuesta',
  'contracts.backToContracts': 'Volver a contratos',
  'contracts.by': 'por',
  'contracts.compliance': 'Cumplimiento',
  'contracts.confirmDelete': '¿Eliminar este contrato? Esta acción no se puede deshacer.',
  'contracts.confirmRegisterPayment': '¿Registrar este pago?',
  'contracts.contract': 'Contrato',
  'contracts.contractParties': 'Partes del contrato',
  'contracts.create': 'Crear Contrato',
  'contracts.created': 'Contrato creado',
  'contracts.createdBy': 'Creado por',
  'contracts.creating': 'Creando...',
  'contracts.defaulted': 'Incumplido',
  'contracts.deleteContract': 'Eliminar contrato',
  'contracts.deleted': 'Contrato eliminado',
  'contracts.description': 'Descripción',
  'contracts.descriptionLabel': 'Descripción',
  'contracts.dueDate': 'Vencimiento',
  'contracts.empty': 'Sin contratos registrados',
  'contracts.endDate': 'Fecha fin',
  'contracts.entity': 'Entidad',
  'contracts.entityProvider': 'Entidad / Proveedor',
  'contracts.errorCreating': 'Error al crear contrato',
  'contracts.errorDeleting': 'Error al eliminar contrato',
  'contracts.errorRegisteringPayment': 'Error al registrar pago',
  'contracts.errorUpdatingStatus': 'Error al actualizar estado',
  'contracts.freq.annual': 'Anual',
  'contracts.freq.bimonthly': 'Bimestral',
  'contracts.freq.biweekly': 'Quincenal',
  'contracts.freq.monthly': 'Mensual',
  'contracts.freq.oneTime': 'Único',
  'contracts.freq.quarterly': 'Trimestral',
  'contracts.freq.semiannual': 'Semestral',
  'contracts.freq.weekly': 'Semanal',
  'contracts.indefinite': 'Indefinido',
  'contracts.installmentAutoGenNote': 'Las parcialidades se generarán automáticamente según la frecuencia.',
  'contracts.installments': 'Parcialidades',
  'contracts.loadingInstallments': 'Cargando parcialidades...',
  'contracts.member': 'Miembro',
  'contracts.nameAndAmountRequired': 'Nombre y monto son obligatorios',
  'contracts.namePlaceholder': 'Nombre del contrato',
  'contracts.new': 'Nuevo Contrato',
  'contracts.noEntity': 'Sin entidad',
  'contracts.noLinkedParties': 'Sin partes vinculadas',
  'contracts.numInstallments': 'Num. parcialidades',
  'contracts.paidDate': 'Pagado',
  'contracts.pay': 'Pagar',
  'contracts.paymentFrequency': 'Frecuencia de pago',
  'contracts.paymentPlan': 'Plan de pagos',
  'contracts.paymentRegistered': 'Pago registrado',
  'contracts.registerPayment': 'Registrar pago',
  'contracts.startDate': 'Fecha inicio',
  'contracts.statusUpdated': 'Estado actualizado',
  'contracts.totalAmount': 'Monto total',
  'deliberation.comment': 'Comentario',
  'deliberation.commentPlaceholder': 'Escribe tu comentario...',
  'deliberation.confirmDeleteComment': '¿Eliminar este comentario?',
  'deliberation.ctrlEnterToSend': 'Ctrl+Enter para enviar',
  'deliberation.edited': '(editado)',
  'deliberation.member': 'Miembro',
  'deliberation.reply': 'Responder',
  'deliberation.stance': 'Postura',
  'deliberation.writeReplyPlaceholder': 'Escribe tu respuesta...',
  'entities.actions': 'Acciones',
  'entities.address': 'Dirección',
  'entities.addressPlaceholder': 'Dirección fiscal',
  'entities.allStatuses': 'Todos los estados',
  'entities.allTypes': 'Todos los tipos',
  'entities.confirmDelete': '¿Eliminar esta entidad?',
  'entities.contact': 'Contacto',
  'entities.contactPerson': 'Persona de Contacto',
  'entities.contactPersonPlaceholder': 'Nombre del contacto principal',
  'entities.create': 'Crear Entidad',
  'entities.creating': 'Creando...',
  'entities.deleted': 'Entidad eliminada',
  'entities.empty': 'No hay entidades registradas. Agrega proveedores, socios y contratistas.',
  'entities.errorCreating': 'Error al crear entidad',
  'entities.errorDeleting': 'Error al eliminar entidad',
  'entities.namePlaceholder': 'Nombre de la entidad',
  'entities.nameRequired': 'El nombre es obligatorio',
  'entities.new': 'Nueva Entidad',
  'entities.notes': 'Notas',
  'entities.notesPlaceholder': 'Notas internas',
  'entities.optional': 'Opcional',
  'entities.phone': 'Teléfono',
  'entities.rating': 'Calificación',
  'entities.rfc': 'RFC',
  'entities.searchPlaceholder': 'Buscar por nombre, RFC, contacto...',
  'entities.status': 'Estado',
  'entities.type': 'Tipo',
  'entities.unrated': 'Sin calificar',
  'recurring.activate': 'Activar',
  'recurring.active': 'Activos',
  'recurring.activeStatus': 'Activo',
  'recurring.allActiveMembers': 'Todos los miembros activos',
  'recurring.allMembers': 'Todos los miembros',
  'recurring.collection': 'Cobro',
  'recurring.collectionToMembers': 'Cobro (a miembros)',
  'recurring.collections': 'Cobros',
  'recurring.confirmDelete': '¿Eliminar este cobro/pago recurrente? No se eliminarán las obligaciones ya generadas.',
  'recurring.creating': 'Creando...',
  'recurring.dayOfMonth': 'Día del mes',
  'recurring.deleteRecurring': 'Eliminar recurrente',
  'recurring.deleted': 'Recurrente eliminado',
  'recurring.description': 'Cobros o pagos que se repiten en el tiempo (ej. cuota mensual, aportación periódica).',
  'recurring.descriptionLabel': 'Descripción',
  'recurring.empty': 'Sin cobros o pagos recurrentes. Crea uno para automatizar cuotas y pagos a proveedores.',
  'recurring.end': 'Fin',
  'recurring.endDateOptional': 'Fecha fin (opcional)',
  'recurring.entityProviderPartner': 'Entidad (proveedor/socio)',
  'recurring.errorCreating': 'Error al crear',
  'recurring.errorDeleting': 'Error al eliminar recurrente',
  'recurring.errorProcessing': 'Error al procesar pendientes',
  'recurring.errorRunning': 'Error al ejecutar recurrente',
  'recurring.errorUpdating': 'Error al actualizar recurrente',
  'recurring.frequency': 'Frecuencia',
  'recurring.lastRun': 'Última',
  'recurring.members': 'Miembros',
  'recurring.more': 'más',
  'recurring.nameAndAmountRequired': 'Nombre y monto son obligatorios',
  'recurring.namePlaceholder': 'Nombre del cobro/pago',
  'recurring.new': 'Nuevo Recurrente',
  'recurring.newRecurring': 'Nuevo Cobro/Pago Recurrente',
  'recurring.nextRun': 'Próxima',
  'recurring.obligationsGenerated': 'Obligaciones generadas',
  'recurring.pause': 'Pausar',
  'recurring.paused': 'Pausado',
  'recurring.payment': 'Pago',
  'recurring.paymentToEntity': 'Pago (a entidad)',
  'recurring.payments': 'Pagos',
  'recurring.pendingProcessed': 'Pendientes procesados',
  'recurring.processPending': 'Procesar Pendientes',
  'recurring.runNow': 'Ejecutar ahora',
  'recurring.runs': 'ejecuciones',
  'recurring.select': 'Seleccionar...',
  'recurring.specificMembers': 'Miembros específicos',
  'recurring.target': 'Destino',
  'recurring.updated': 'Recurrente actualizado',
  'treasury.actual': 'Real',
  'treasury.allFieldsRequired': 'Todos los campos son obligatorios',
  'treasury.amount': 'Monto',
  'treasury.budget': 'Presupuesto',
  'treasury.budgetDeleted': 'Presupuesto eliminado',
  'treasury.category': 'Categoría',
  'treasury.categoryCreated': 'Categoría creada exitosamente',
  'treasury.categoryDeleted': 'Categoría eliminada',
  'treasury.categoryNamePlaceholder': 'Nombre de categoría',
  'treasury.categoryUpdated': 'Categoría actualizada',
  'treasury.confirmDeleteBudget': '¿Estás seguro de eliminar este presupuesto? Esta acción no se puede deshacer.',
  'treasury.confirmDeleteCategory': '¿Eliminar esta categoría? Las transacciones existentes conservarán su historial.',
  'treasury.create': 'Crear',
  'treasury.creating': 'Creando...',
  'treasury.deleteBudget': 'Eliminar presupuesto',
  'treasury.deleteCategory': 'Eliminar categoría',
  'treasury.difference': 'Diferencia',
  'treasury.errorCreatingBudget': 'Error al crear presupuesto',
  'treasury.errorCreatingCategory': 'Error al crear categoría',
  'treasury.errorDeletingBudget': 'Error al eliminar presupuesto',
  'treasury.errorDeletingCategory': 'Error al eliminar categoría',
  'treasury.errorUpdatingBudget': 'Error al actualizar presupuesto',
  'treasury.errorUpdatingCategory': 'Error al actualizar categoría',
  'treasury.expense': 'Gasto',
  'treasury.income': 'Ingreso',
  'treasury.loadingBudgets': 'Cargando presupuestos...',
  'treasury.loadingCategories': 'Cargando categorías...',
  'treasury.newBudget': 'Nuevo Presupuesto',
  'treasury.noBudgets': 'No hay presupuestos definidos.',
  'treasury.noCategories': 'No hay categorías configuradas',
  'treasury.period': 'Periodo',
  'treasury.selectCategory': 'Seleccionar categoría...',
  'treasury.system': 'Sistema',
}

const en: Dictionary = {
  'nav.dashboard': 'Dashboard',
  'nav.community': 'Community',
  'nav.treasury': 'Finances',
  'nav.governance': 'Governance',
  'nav.announcements': 'Announcements',
  'nav.calendar': 'Calendar',
  'nav.vigilancia': 'Oversight',
  'nav.settings': 'Settings',
  'nav.rules': 'Rules',
  'nav.members': 'Members',
  'nav.entities': 'Related Parties',
  'nav.documents': 'Documents',
  'nav.census': 'Census',
  'nav.import': 'Import Data',
  'nav.payments': 'Payments',
  'nav.more': 'More',
  'nav.section.nation': 'My Nation',
  'nav.section.treasury': 'Treasury',
  'nav.section.governance': 'Governance',
  'nav.section.services': 'Services',
  'nav.section.admin': 'Administration',
  'nav.switcher.title': 'Your communities',
  'nav.switcher.new': 'New Community',
  'nav.search': 'Search…',
  'dashboard.title': 'State of the Nation',
  'dashboard.greeting': 'Hello',
  'dashboard.legalFramework': 'Legal framework',
  'dashboard.loading': 'Loading...',
  'dashboard.error': 'Error loading some data. Try refreshing the page.',
  'dashboard.health.excellent': 'Excellent',
  'dashboard.health.healthy': 'Healthy',
  'dashboard.health.attention': 'Attention',
  'dashboard.health.critical': 'Critical',
  'dashboard.proposals': 'Active proposals',
  'dashboard.assemblies': 'Upcoming assemblies',
  'dashboard.viewAll': 'View all',
  'dashboard.recentActivity': 'Recent Activity',
  'dashboard.systemConfig': 'System Configuration',
  'dashboard.latestTransactions': 'Latest transactions',
  'dashboard.incomeVsExpense': 'Income vs Expenses',
  'community.tabs.members': 'Members',
  'community.tabs.directory': 'Directory',
  'community.tabs.activity': 'Activity',
  'community.title': 'Community',
  'community.subtitle': 'Members, directory and activity for your community',
  'common.settings': 'Administration',
  'common.logout': 'Sign out',
  'common.save': 'Save',
  'common.saving': 'Saving...',
  'common.cancel': 'Cancel',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.add': 'Add',
  'common.close': 'Close',
  'common.confirm': 'Confirm',
  'common.send': 'Send',
  'common.sending': 'Sending...',
  'common.search': 'Search',
  'common.email': 'Email',
  'common.password': 'Password',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Done',
  'common.back': 'Back',
  'common.name': 'Name',
  'onboarding.step.type': 'Type',
  'onboarding.step.data': 'Data',
  'onboarding.step.structure': 'Structure',
  'onboarding.step.categories': 'Categories',
  'onboarding.step.rules': 'Rules',
  'onboarding.step.confirm': 'Confirm',
  'onboarding.back': 'Back',
  'onboarding.next': 'Next',
  'onboarding.cancel': 'Cancel',
  'onboarding.create': 'Create Community',
  'onboarding.creating': 'Creating...',
  'settings.title': 'Community Settings',
  'settings.adminOnly': 'Only administrators can access this section.',
  'settings.tab.general': 'General',
  'settings.tab.categories': 'Categories',
  'settings.tab.invitations': 'Invitations',
  'settings.tab.rules': 'Rules',
  'settings.tab.privacy': 'Privacy',
  'settings.tab.terms': 'Terms',
  'treasury.title': 'Treasury',
  'treasury.subtitle': 'Summary, collection and community transactions',
  'treasury.mode.import': 'Import / Manual',
  'treasury.mode.fintech_rail': 'Fintech Rail (SPEI)',
  'treasury.mode.connector': 'Bank Connector',
  'treasury.mode.hybrid': 'Hybrid',
  'treasury.section.resumen': 'Summary',
  'treasury.section.resumen.desc': 'General overview',
  'treasury.section.cobro': 'Collection',
  'treasury.section.cobro.desc': 'Obligations and payments',
  'treasury.section.programacion': 'Scheduling',
  'treasury.section.programacion.desc': 'Recurring and contracts',
  'treasury.section.datos': 'Data and reports',
  'treasury.section.datos.desc': 'Transactions and reporting',
  'treasury.export.pdf.title': 'Export current view to PDF',
  'treasury.export.excel.title': 'Export transactions list to Excel',
  'treasury.import': 'Import',
  'treasury.manualCapture': 'Manual entry',
  'treasury.banner.phase2': 'Set up the financial integration to receive SPEI payments and reconcile automatically.',
  'treasury.fund': 'Fund',
  'treasury.cobro.obligations': 'Obligations',
  'treasury.cobro.collection': 'Account and collection',
  'treasury.cobro.myPayments': 'My payments',
  'treasury.programacion.recurring': 'Recurring',
  'treasury.programacion.contracts': 'Contracts',
  'treasury.programacion.paymentPlans': 'Payment plans',
  'treasury.datos.transactions': 'Transactions',
  'treasury.datos.budgets': 'Budgets',
  'treasury.datos.statements': 'Financial statements',
  'treasury.member.subtitle': 'Your payments and instructions',
  'treasury.member.loading': 'Loading your payments…',
  'treasury.member.totalPendiente': 'Total pending',
  'treasury.member.totalPagado': 'Total paid',
  'treasury.member.estadoFinanciero': 'Financial status',
  'treasury.member.status.moroso': 'Delinquent',
  'treasury.member.status.pendiente': 'Pending',
  'treasury.member.status.alCorriente': 'In good standing',
  'treasury.member.resumenComunidad': 'Community summary',
  'governance.title': 'Governance',
  'governance.subtitle.proposals': 'Proposals and voting',
  'governance.subtitle.assemblies': 'Assemblies and calls',
  'governance.export': 'Export',
  'governance.newAssembly': 'New Assembly',
  'governance.newProposal': 'New Proposal',
  'governance.tab.proposals': 'Proposals',
  'governance.tab.active': 'Active',
  'governance.tab.discussion': 'In Discussion',
  'governance.tab.draft': 'Drafts',
  'governance.tab.closed': 'Closed',
  'governance.tab.all': 'All',
  'governance.tab.assemblies': 'Assemblies',
  'governance.tab.delegations': 'Delegations',
  'governance.tab.minutes': 'Minutes',
  'governance.tab.rules': 'Rules',
  'members.title': 'Members',
  'members.subtitle': 'Community members directory',
  'members.export': 'Export',
  'transactions.toast.verified': 'Verification status updated',
  'transactions.toast.verifyError': 'Error verifying transaction',
  'transactions.toast.updateError': 'Error updating transaction',
  'transactions.toast.deleted': 'Transaction deleted',
  'transactions.toast.deleteError': 'Error deleting transaction',
  'transactions.confirmDelete': 'Are you sure you want to delete this transaction?',
  'transactions.filter.allTypes': 'All types',
  'transactions.filter.income': 'Income',
  'transactions.filter.expense': 'Expenses',
  'transactions.filter.from': 'From',
  'transactions.filter.to': 'To',
  'transactions.table.date': 'Date',
  'transactions.table.description': 'Description',
  'transactions.table.category': 'Category',
  'transactions.table.type': 'Type',
  'transactions.table.origin': 'Origin',
  'transactions.table.verification': 'Verification',
  'transactions.table.amount': 'Amount',
  'transactions.table.actions': 'Actions',
  'transactions.table.loading': 'Loading...',
  'transactions.table.empty': 'No transactions. Import data to begin.',
  'transactions.edit.noCategory': 'No category',
  'transactions.edit.save': 'Save',
  'transactions.edit.cancel': 'Cancel',
  'transactions.badge.income': 'Income',
  'transactions.badge.expense': 'Expense',
  'transactions.origin.rail': 'Rail',
  'transactions.origin.import': 'Imported',
  'transactions.origin.system': 'System',
  'transactions.origin.manual': 'Manual',
  'transactions.verification.verified': 'Verified',
  'transactions.verification.disputed': 'Disputed',
  'transactions.verification.reported': 'Reported',
  'transactions.action.verify': 'Verify',
  'transactions.action.edit': 'Edit',
  'transactions.action.delete': 'Delete',
  'transactions.modal.title': 'Edit transaction',
  'obligations.summary.pending': 'Pending',
  'obligations.summary.overdue': 'Overdue',
  'obligations.summary.paid': 'Paid',
  'obligations.filter.allStatuses': 'All statuses',
  'obligations.status.pending': 'Pending',
  'obligations.status.paid': 'Paid',
  'obligations.status.overdue': 'Overdue',
  'obligations.status.partial': 'Partial',
  'obligations.new': 'New Obligation',
  'obligations.table.member': 'Member',
  'obligations.table.concept': 'Concept',
  'obligations.table.amount': 'Amount',
  'obligations.table.dueDate': 'Due date',
  'obligations.table.status': 'Status',
  'obligations.table.link': 'Link',
  'obligations.table.actions': 'Actions',
  'obligations.table.loading': 'Loading...',
  'obligations.table.empty': 'No payment obligations registered.',
  'obligations.linkedTx': 'Linked tx',
  'obligations.registerPayment': 'Register Payment',
  'proposals.loading': 'Loading proposals...',
  'proposals.empty': 'No proposals.',
  'proposals.status.draft': 'Draft',
  'proposals.status.discussion': 'In Discussion',
  'proposals.status.active': 'Active',
  'proposals.status.closed': 'Closed',
  'proposals.status.approved': 'Approved',
  'proposals.status.rejected': 'Rejected',
  'proposals.status.executed': 'Executed',
  'proposals.type.ordinary': 'Ordinary',
  'proposals.type.extraordinary': 'Extraordinary',
  'proposals.type.budget': 'Budget',
  'proposals.type.election': 'Election',
  'proposals.type.amendment': 'Amendment',
  'proposals.meta.created': 'Created',
  'proposals.meta.voting': 'Voting',
  'proposals.meta.close': 'Close',
  'assemblies.loading': 'Loading assemblies...',
  'assemblies.empty': 'No assemblies registered.',
  'assemblies.present': 'present',
  'assemblies.quorumMet': 'Quorum reached',
  'assemblies.status.scheduled': 'Scheduled',
  'assemblies.status.convened': 'Convened',
  'assemblies.status.in_session': 'In session',
  'assemblies.status.first_call': '1st call',
  'assemblies.status.second_call': '2nd call',
  'assemblies.status.third_call': '3rd call',
  'assemblies.status.completed': 'Completed',
  'assemblies.status.cancelled': 'Cancelled',
  'assemblies.type.ordinary': 'Ordinary',
  'assemblies.type.extraordinary': 'Extraordinary',
  'obligationDialog.title': 'New Payment Obligation',
  'obligationDialog.error.required': 'All fields are required',
  'obligationDialog.error.memberRequired': 'Select a member or enable "For all active members"',
  'obligationDialog.error.amountPositive': 'Amount must be greater than zero',
  'obligationDialog.error.amountLimit': 'Amount exceeds allowed limit',
  'obligationDialog.error.noActiveMembers': 'There are no active members',
  'obligationDialog.error.create': 'Error creating obligation',
  'obligationDialog.forAll': 'For all active members',
  'obligationDialog.member': 'Member',
  'obligationDialog.memberPlaceholder': 'Select member...',
  'obligationDialog.concept': 'Concept',
  'obligationDialog.conceptPlaceholder': 'Ex: Maintenance fee January 2025',
  'obligationDialog.amount': 'Amount',
  'obligationDialog.dueDate': 'Due Date',
  'obligationDialog.cancel': 'Cancel',
  'obligationDialog.create': 'Create',
  'obligationDialog.creating': 'Creating...',
  'paymentDialog.title': 'Register Payment',
  'paymentDialog.error.register': 'Error registering payment',
  'paymentDialog.concept': 'Concept',
  'paymentDialog.method': 'Payment Method',
  'paymentDialog.reference': 'Reference / Folio (optional)',
  'paymentDialog.referencePlaceholder': 'Ex: SPEI-123456, receipt #42',
  'paymentDialog.date': 'Payment Date',
  'paymentDialog.notes': 'Notes (optional)',
  'paymentDialog.notesPlaceholder': 'Additional notes about the payment',
  'paymentDialog.info': 'When registering payment, an income transaction linked to this obligation will be automatically created.',
  'paymentDialog.cancel': 'Cancel',
  'paymentDialog.confirm': 'Confirm Payment',
  'paymentDialog.registering': 'Registering...',
  'proposalDialog.title': 'New Proposal',
  'proposalDialog.titleWithTemplate': 'New Proposal',
  'proposalDialog.noPermissionTitle': 'You cannot create proposals',
  'proposalDialog.selectTemplate': 'Select the proposal type you want to create:',
  'proposalDialog.type': 'Type',
  'proposalDialog.error.noPermission': 'You do not have permission to create proposals',
  'proposalDialog.error.titleRequired': 'Title is required',
  'proposalDialog.error.descriptionRequired': 'Description is required',
  'proposalDialog.error.typeRequired': 'Select a proposal type',
  'proposalDialog.error.quorum': 'Quorum error. Contact administrator.',
  'proposalDialog.error.majority': 'Majority error. Contact administrator.',
  'proposalDialog.error.endFuture': 'Voting end date must be in the future',
  'proposalDialog.error.startBeforeEnd': 'Start date must be before end date',
  'proposalDialog.error.multipleChoiceMin': 'You must add at least 2 options for multiple choice voting',
  'proposalDialog.error.fiAmount': 'Financial instruction amount must be greater than or equal to zero',
  'proposalDialog.error.fiNewAmount': 'New amount (fee) must be greater than or equal to zero',
  'proposalDialog.error.create': 'Error creating proposal',
  'proposalDialog.note.election': 'Note: Delinquent members cannot be elected to administration positions (Art. 2 LPCI). Verify candidates payment status.',
  'proposalDialog.quorum': 'Quorum',
  'proposalDialog.majority': 'Majority',
  'proposalDialog.rulesDefined': 'Defined by your community rules',
  'proposalDialog.votingModel': 'Voting Model',
  'proposalDialog.voting.simple': 'Simple (For / Against / Abstain)',
  'proposalDialog.voting.consensus': 'Consensus (Agree / Disagree / Abstain / Block)',
  'proposalDialog.voting.multiple': 'Multiple Choice',
  'proposalDialog.voting.consensusHelp': 'In consensus model, any member can block a proposal with a mandatory reason.',
  'proposalDialog.voting.multipleHelp': 'Add the options members can choose from:',
  'proposalDialog.voting.option': 'Option',
  'proposalDialog.voting.addOption': 'Add option',
  'proposalDialog.discussion.title': 'Discussion Period',
  'proposalDialog.discussion.include': 'Include discussion period before voting',
  'proposalDialog.discussion.required': 'Required',
  'proposalDialog.discussion.duration': 'Discussion duration (hours)',
  'proposalDialog.discussion.help': 'Voting cannot start until discussion period ends.',
  'proposalDialog.votingStart': 'Voting start',
  'proposalDialog.votingEnd': 'Voting end',
  'proposalDialog.autoExecution': 'Auto-execution active: if proposal is approved, financial instruction will be automatically executed after {hours}h cool down.',
  'proposalDialog.back': 'Back',
  'proposalDialog.create': 'Create Proposal',
  'proposalDialog.creating': 'Creating...',
  'assemblyDialog.title': 'New Assembly',
  'assemblyDialog.type': 'Assembly Type',
  'assemblyDialog.type.ordinary': 'Ordinary',
  'assemblyDialog.type.extraordinary': 'Extraordinary',
  'assemblyDialog.titleLabel': 'Title',
  'assemblyDialog.titlePlaceholder': 'Ex: Ordinary Assembly Q1 2026',
  'assemblyDialog.date': 'Date and Time',
  'assemblyDialog.noticeWarning': 'Notice must be issued at least {days} days in advance (Art. 34 LPCI). Selected date does not meet this requirement.',
  'assemblyDialog.location': 'Location',
  'assemblyDialog.locationPlaceholder': 'Ex: Multipurpose hall, floor 1',
  'assemblyDialog.agenda': 'Agenda',
  'assemblyDialog.addItem': 'Add item',
  'assemblyDialog.topicPlaceholder': 'Topic',
  'assemblyDialog.descriptionPlaceholder': 'Description (optional)',
  'assemblyDialog.error.titleRequired': 'Title is required',
  'assemblyDialog.error.dateRequired': 'Date is required',
  'assemblyDialog.error.locationRequired': 'Location is required',
  'assemblyDialog.error.agendaTopicRequired': 'All agenda items must have a topic',
  'assemblyDialog.error.create': 'Error creating assembly',
  'assemblyDialog.success': 'Assembly created successfully. Notice was generated automatically.',
  'assemblyDialog.cancel': 'Cancel',
  'assemblyDialog.create': 'Create Assembly',
  'assemblyDialog.creating': 'Creating...',
  'proposalDetail.back': 'Back',
  'proposalDetail.title': 'Proposal Detail',
  'proposalDetail.notFound': 'Proposal not found.',
  'assemblyDetail.loading': 'Loading assembly...',
  'assemblyDetail.notFound': 'Assembly not found.',
  'assemblyDetail.backToGovernance': 'Back to Governance',
  'assemblyDetail.defaultCaller': 'Administrator',
  'assemblyDetail.actions': 'Actions',
  'assemblyDetail.startFirstCall': 'Start 1st Call',
  'assemblyDetail.toSecondCall': 'Move to 2nd Call',
  'assemblyDetail.toThirdCall': 'Move to 3rd Call',
  'assemblyDetail.startSession': 'Start Session',
  'assemblyDetail.complete': 'Complete',
  'assemblyDetail.completeAssembly': 'Complete Assembly',
  'assemblyDetail.cancel': 'Cancel',
  'assemblyDetail.agenda': 'Agenda',
  'assemblyDetail.calls': 'Notices',
  'assemblyDetail.notes': 'Notes',
  'assemblyDetail.memberFallback': 'Member',
  'assemblyDetail.toast.statusUpdated': 'Status updated to: {status}',
  'assemblyDetail.toast.statusError': 'Error updating status',
  'generalFields.title': 'Title',
  'generalFields.titlePlaceholder': 'Proposal title',
  'generalFields.description': 'Description',
  'generalFields.descriptionPlaceholder': 'Describe the proposal...',
  'gastoFields.fund.maintenance': 'Maintenance fund',
  'gastoFields.fund.reserve': 'Reserve fund',
  'gastoFields.title': 'Expense',
  'gastoFields.conceptLabel': 'Concept',
  'gastoFields.quotesLabel': 'Quotes (URLs or references)',
  'gastoFields.quotesPlaceholder': 'Links to quotes or notes',
  'gastoFields.fundLabel': 'Fund',
  'gastoFields.entityLabel': 'Beneficiary / Supplier',
  'gastoFields.entityPlaceholder': 'Search supplier or beneficiary...',
  'gastoFields.amountLabel': 'Amount',
  'gastoFields.amountPlaceholder': '0.00',
  'gastoFields.conceptPlaceholder': 'Expense description',
  'gastoFields.desc.concept': 'Concept: {value}',
  'gastoFields.desc.quotes': 'Quotes or references:\n{value}',
  'cuotaFields.type.ordinary': 'Ordinary fee',
  'cuotaFields.type.extraordinary': 'Extraordinary fee',
  'cuotaFields.currentAmountLabel': 'Current amount (reference)',
  'cuotaFields.currentAmountPlaceholder': 'Optional — current amount for reference',
  'cuotaFields.newAmountLabel': 'New amount',
  'cuotaFields.effectiveDateLabel': 'Effective date',
  'cuotaFields.appliesToLabel': 'Applies to',
  'cuotaFields.appliesToPlaceholder': 'Search fee type...',
  'cuotaFields.impactTitle': 'Estimated impact',
  'cuotaFields.impactPeriod': 'period',
  'cuotaFields.titlePrefix': 'Fee change',
  'cuotaFields.desc.current': 'Current amount (reference): {currency} {value}',
  'cuotaFields.desc.new': 'Proposed new amount: {currency} {value}',
  'cuotaFields.desc.indicate': '[indicate]',
  'cuotaFields.desc.effective': 'Effective date: {value}',
  'cuotaFields.desc.applies': 'Applies to: {value}',
  'cuotaFields.desc.impact': 'Estimated impact ({count} members): {currency} {value} monthly',
  'presupuestoFields.period.monthly': 'Monthly',
  'presupuestoFields.period.quarterly': 'Quarterly',
  'presupuestoFields.period.yearly': 'Yearly',
  'presupuestoFields.fund.maintenance': 'Maintenance fund',
  'presupuestoFields.fund.reserve': 'Reserve fund',
  'presupuestoFields.categoryLabel': 'Category',
  'presupuestoFields.categoryPlaceholder': 'Search category...',
  'presupuestoFields.amountLabel': 'Requested amount',
  'presupuestoFields.periodLabel': 'Period',
  'presupuestoFields.periodPlaceholder': 'Search period...',
  'presupuestoFields.fundLabel': 'Fund',
  'presupuestoFields.fundPlaceholder': 'Search fund...',
  'presupuestoFields.titlePrefix': 'Budget',
  'presupuestoFields.desc.category': 'Category: {value}',
  'presupuestoFields.desc.amount': 'Requested amount: {currency} {value}',
  'presupuestoFields.desc.period': 'Period: {value}',
  'presupuestoFields.desc.fund': 'Fund: {value}',
  'cambioReglaFields.ruleLabel': 'Rule to modify',
  'cambioReglaFields.rulePlaceholder': 'Search rule you want to change...',
  'cambioReglaFields.newValueLabel': 'Proposed new value',
  'cambioReglaFields.newValuePlaceholder': 'Ex: {current} -> new value',
  'cambioReglaFields.justificationLabel': 'Legal justification / reason for change',
  'cambioReglaFields.justificationPlaceholder': 'Explain why this change is needed and, if applicable, legal reference.',
  'cambioReglaFields.description.propose': 'I propose changing the rule "{label}".',
  'cambioReglaFields.titlePrefix': 'Rule change',
  'cambioReglaFields.description.current': 'Current value: {value}',
  'cambioReglaFields.description.new': 'Proposed new value: {value}',
  'cambioReglaFields.description.complete': '[complete]',
  'cambioReglaFields.description.justification': 'Justification: {value}',
  'cambioReglaFields.description.justificationPlaceholder': 'Justification: [explain why this change is needed]',
  'rulePicker.noResults': 'No rules found',
  'rulePicker.currentValue': 'Current value:',
  'searchableSelect.placeholder': 'Search or select...',
  'searchableSelect.empty': 'No results',
  'categoryPicker.label': 'Category',
  'categoryPicker.placeholder': 'Search category...',
  'categoryPicker.noResults': 'No results',
  'categoryPicker.loading': 'Loading...',
  'entityPicker.placeholder': 'Search supplier or beneficiary...',
  'entityPicker.label': 'Beneficiary',
  'entityPicker.type.provider': 'Supplier',
  'entityPicker.type.contractor': 'Contractor',
  'entityPicker.type.partner': 'Business Partner',
  'entityPicker.type.other': 'Other',
  'entityPicker.createNew': 'Create new supplier',
  'entityPicker.newProvider': 'New supplier',
  'entityPicker.cancel': 'Cancel',
  'entityPicker.namePlaceholder': 'Supplier name',
  'entityPicker.phonePlaceholder': 'Phone (optional)',
  'entityPicker.errorCreate': 'Error creating supplier',
  'entityPicker.creating': 'Creating...',
  'entityPicker.createAndSelect': 'Create and select',
  'eleccionFields.role.admin': 'Administrator',
  'eleccionFields.role.vigilance': 'Supervisory committee',
  'eleccionFields.role.treasurer': 'Treasurer',
  'eleccionFields.titlePrefix': 'Election',
  'eleccionFields.desc.role': 'Role: {value}',
  'eleccionFields.desc.period': 'Term: {value}',
  'eleccionFields.desc.candidates': 'Candidates: {value}',
  'eleccionFields.desc.warning': 'Notice: Delinquent members are not eligible under the bylaws.',
  'eleccionFields.roleLabel': 'Role to elect',
  'eleccionFields.rolePlaceholder': 'Search role...',
  'eleccionFields.candidatesLabel': 'Candidates',
  'eleccionFields.add': 'Add',
  'eleccionFields.candidatePlaceholder': 'Candidate {index}',
  'eleccionFields.removeCandidate': 'Remove candidate',
  'eleccionFields.periodLabel': 'Role term',
  'eleccionFields.periodPlaceholder': 'Ex: 2025-2026, 12 months',
  'eleccionFields.includeWarning': 'Include notice: delinquent members not eligible',
  'emergenciaFields.titlePrefix': 'Emergency expense',
  'emergenciaFields.desc.intro': 'Emergency expense proposal.',
  'emergenciaFields.desc.beneficiary': 'Beneficiary: {value}',
  'emergenciaFields.desc.amount': 'Estimated amount: {currency} {value}',
  'emergenciaFields.desc.evidence': 'Evidence (photos/URLs):\n{value}',
  'emergenciaFields.desc.justification': 'Emergency justification:\n{value}',
  'emergenciaFields.alert': 'This proposal is for urgent spending. Include evidence and justification.',
  'emergenciaFields.beneficiaryLabel': 'Beneficiary / Supplier',
  'emergenciaFields.beneficiaryPlaceholder': 'Search supplier or beneficiary...',
  'emergenciaFields.amountLabel': 'Estimated amount',
  'emergenciaFields.evidenceLabel': 'Evidence (photos or URLs)',
  'emergenciaFields.evidencePlaceholder': 'Links to photos, reports, or documents supporting the emergency',
  'emergenciaFields.justificationLabel': 'Emergency justification',
  'emergenciaFields.justificationPlaceholder': 'Why it is urgent and cannot wait for ordinary process',
  'obraFields.titlePrefix': 'Project',
  'obraFields.desc.contractor': 'Contractor: {value}',
  'obraFields.desc.total': 'Total amount: {currency} {value}',
  'obraFields.desc.duration': 'Estimated duration: {value}',
  'obraFields.desc.schedule': 'Payment schedule:\n{value}',
  'obraFields.desc.quotes': 'Quotes (min. {min}):\n{value}',
  'obraFields.desc.noValue': '—',
  'obraFields.desc.scheduleFallback': 'See schedule',
  'obraFields.contractorLabel': 'Contractor',
  'obraFields.contractorPlaceholder': 'Search contractor...',
  'obraFields.totalLabel': 'Total amount',
  'obraFields.durationLabel': 'Estimated duration',
  'obraFields.durationPlaceholder': 'Ex: 3 months, 90 days',
  'obraFields.scheduleLabel': 'Payment schedule',
  'obraFields.phase': 'Phase',
  'obraFields.phasePlaceholder': 'Phase / concept',
  'obraFields.amountPlaceholder': 'Amount',
  'obraFields.datePlaceholder': 'Date',
  'obraFields.removeRow': 'Remove row',
  'obraFields.quotesLabel': 'Quotes (minimum {min})',
  'obraFields.quotesPlaceholder': 'One per line or comma-separated',
  'obraFields.quotesWarning': 'At least {min} quotes are recommended. Current: {count}.',
  'admisionFields.doc.id': 'Official ID',
  'admisionFields.doc.address': 'Proof of address',
  'admisionFields.doc.signedRequest': 'Signed admission request',
  'admisionFields.doc.others': 'Other documents',
  'admisionFields.titlePrefix': 'Admission',
  'admisionFields.desc.candidate': 'Candidate: {value}',
  'admisionFields.desc.email': 'Email (invitation): {value}',
  'admisionFields.desc.unit': 'Unit / Department: {value}',
  'admisionFields.desc.docs': 'Submitted documentation:',
  'admisionFields.desc.docLine': '- {label}: {value}',
  'admisionFields.yes': 'Yes',
  'admisionFields.no': 'No',
  'admisionFields.candidateLabel': 'Candidate name',
  'admisionFields.candidatePlaceholder': 'Full name',
  'admisionFields.emailLabel': 'Email (for invitation)',
  'admisionFields.emailPlaceholder': 'email@example.com',
  'admisionFields.unitLabel': 'Unit / Department',
  'admisionFields.unitPlaceholder': 'Optional',
  'admisionFields.docsLabel': 'Submitted documentation',
  'proposalDetail.loading': 'Loading proposal...',
  'proposalDetail.notFoundAccess': 'Proposal not found or you do not have access.',
  'proposalDetail.backToGovernance': 'Back to Governance',
  'proposalDetail.status.draft': 'Draft',
  'proposalDetail.status.discussion': 'In Discussion',
  'proposalDetail.status.active': 'Voting Active',
  'proposalDetail.status.closed': 'Closed',
  'proposalDetail.status.approved': 'Approved',
  'proposalDetail.status.rejected': 'Rejected',
  'proposalDetail.status.executed': 'Executed',
  'proposalDetail.countdown.expired': 'Expired',
  'proposalDetail.countdown.time': 'Time',
  'proposalDetail.countdown.timeLeft': 'Time left',
  'proposalDetail.badge.appealed': 'Appealed',
  'proposalDetail.meta.by': 'By',
  'proposalDetail.meta.created': 'Created',
  'proposalDetail.meta.discussion': 'Discussion',
  'proposalDetail.meta.votingStart': 'Voting start',
  'proposalDetail.meta.close': 'Close',
  'proposalDetail.meta.quorum': 'Quorum',
  'proposalDetail.meta.majority': 'Majority',
  'proposalDetail.model.consensus': 'Consensus',
  'proposalDetail.model.multiple': 'Multiple choice',
  'proposalDetail.closed': 'Closed',
  'proposalDetail.method': 'Method',
  'proposalDetail.method.autoClose': 'Auto close',
  'proposalDetail.countdown.discussion': 'Discussion',
  'proposalDetail.countdown.voting': 'Voting',
  'proposalDetail.countdown.appeal': 'Appeal period',
  'proposalDetail.appealedPaused': 'This proposal was appealed — automatic execution is paused',
  'proposalDetail.discussionHours': 'Discussion hours',
  'proposalDetail.starting': 'Starting...',
  'proposalDetail.startDiscussion': 'Start Discussion',
  'proposalDetail.votingClose': 'Voting close',
  'proposalDetail.opening': 'Opening...',
  'proposalDetail.openVoting': 'Open Voting',
  'proposalDetail.openDirectVoting': 'Open Direct Voting',
  'proposalDetail.closeVoting': 'Close Voting',
  'proposalDetail.appealing': 'Appealing...',
  'proposalDetail.appealProposal': 'Appeal Proposal',
  'proposalDetail.outcomeTitle': 'Outcome Declaration',
  'proposalDetail.outcomeDeclared': 'Declared outcome:',
  'proposalDetail.outcomeDeclaredAt': 'Declared on',
  'proposalDetail.outcomePlaceholder': 'Describe the official outcome of this proposal...',
  'proposalDetail.declaring': 'Declaring...',
  'proposalDetail.declareOutcome': 'Declare Outcome',
  'proposalDetail.cancel': 'Cancel',
  'proposalDetail.voteRegistered': 'Vote recorded',
  'proposalDetail.voteError': 'Error recording vote',
  'proposalDetail.toast.discussionStarted': 'Discussion period started',
  'proposalDetail.toast.discussionError': 'Error starting discussion',
  'proposalDetail.toast.votingOpened': 'Voting opened',
  'proposalDetail.toast.votingOpenError': 'Error opening voting',
  'proposalDetail.toast.outcomeDeclared': 'Outcome declared',
  'proposalDetail.toast.outcomeError': 'Error declaring outcome',
  'proposalDetail.toast.appealed': 'Proposal appealed — execution paused',
  'proposalDetail.toast.appealError': 'Error appealing',
  'proposalDetail.financialInstruction': 'Financial Instruction',
  'proposalDetail.fi.type': 'Type',
  'proposalDetail.fi.amount': 'Amount',
  'proposalDetail.fi.newAmount': 'New amount',
  'proposalDetail.fi.description': 'Description',
  'proposalDetail.fi.period': 'Period',
  'proposalDetail.fi.effectiveDate': 'Effective date',
  'proposalDetail.fi.beneficiary': 'Beneficiary',
  'proposalDetail.fi.config': 'Configuration',
  'proposalDetail.fi.type.disbursement': 'Disbursement',
  'proposalDetail.fi.type.budgetAllocation': 'Budget allocation',
  'proposalDetail.fi.type.quotaChange': 'Fee change',
  'proposalDetail.fi.type.configChange': 'Config change',
  'proposalDetail.fi.type.none': 'No instruction',
  'proposalDetail.executedAt': 'Executed on',
  'proposalDetail.executionPausedByAppeal': 'Execution paused by appeal',
  'proposalDetail.cooldownRunning': 'Cool down period — auto execution on {date}',
  'proposalDetail.cooldownComplete': 'Cool down period completed — ready to execute',
  'proposalDetail.executeNow': 'Execute Now',
  'proposalDetail.executing': 'Executing...',
  'proposalDetail.executionFailed': 'Execution failed — you can retry',
  'proposalDetail.retrying': 'Retrying...',
  'proposalDetail.retryExecution': 'Retry Execution',
  'proposalDetail.executeManually': 'Execute Manually',
  'attendance.title': 'Attendance Control',
  'attendance.presentCount': '{present}/{total} present',
  'attendance.indiviso': '{pct}% indiviso',
  'attendance.searchPlaceholder': 'Search member...',
  'attendance.markAll': 'Mark all',
  'attendance.saving': 'Saving...',
  'attendance.save': 'Save',
  'attendance.weight': '{value}% weight',
  'attendance.toast.saved': 'Attendance recorded successfully',
  'attendance.toast.error': 'Error recording attendance',
  'convocatoria.title': 'Notice - {call}th Call',
  'convocatoria.badge.noticeValid': 'Valid notice',
  'convocatoria.badge.noticeInsufficient': 'Insufficient notice',
  'convocatoria.typeLabel': 'Assembly type:',
  'convocatoria.locationLabel': 'Location:',
  'convocatoria.locationMissing': 'Not specified',
  'convocatoria.dateLabel': 'Date and time:',
  'convocatoria.calledByLabel': 'Called by:',
  'convocatoria.calledByDefault': 'Administrator',
  'convocatoria.issuedLabel': 'Issued date:',
  'convocatoria.noticeLabel': 'Minimum notice:',
  'convocatoria.noticeValue': '{days} days ({required} required)',
  'convocatoria.agenda': 'Agenda',
  'convocatoria.notificationsDelivered': '{count} notifications delivered',
  'proxy.title': 'Representation (Proxies)',
  'proxy.activeCount': '{count} active representations',
  'proxy.rulesTitle': 'Art. 36 LPCI CDMX - Representation rules:',
  'proxy.rule.1': 'Each condo owner may designate one representative',
  'proxy.rule.2': 'A representative cannot represent more than 2 owners',
  'proxy.rule.3': 'Administrator cannot act as representative',
  'proxy.loading': 'Loading representations...',
  'proxy.activeList': 'Active representations:',
  'proxy.maxReached': 'Max reached',
  'proxy.revoke': 'Revoke representation',
  'proxy.empty': 'No active representations for this assembly.',
  'proxy.grant': 'Grant representation',
  'proxy.grantorPlaceholder': 'Owner delegating...',
  'proxy.representativePlaceholder': 'Representative...',
  'proxy.representationsCount': '({count}/2 representations)',
  'proxy.granting': 'Granting...',
  'proxy.grantButton': 'Grant',
  'proxy.noRepresentatives': 'No representatives available. Everyone already represents 2 people or are administrators.',
  'proxy.toast.granted': 'Representation granted successfully',
  'proxy.toast.grantError': 'Error granting representation',
  'proxy.toast.revoked': 'Representation revoked',
  'proxy.toast.revokeError': 'Error revoking representation',
  'votingPanel.title': 'Your Vote',
  'votingPanel.toast.success': 'Vote recorded',
  'votingPanel.toast.error': 'Error recording vote',
  'votingPanel.voiceOnly': 'You have speaking rights in the assembly but no voting rights.',
  'votingPanel.alreadyVoted': 'You already voted:',
  'votingPanel.canChange': 'You can change your vote.',
  'votingPanel.yes': 'In favor',
  'votingPanel.no': 'Against',
  'votingPanel.abstain': 'Abstain',
  'multipleChoice.title': 'Multiple Choice Voting',
  'multipleChoice.myVote': 'Your vote:',
  'multipleChoice.votesCount': '{count} votes',
  'multipleChoice.totalVotes': '{count} votes cast',
  'consensus.option.agree': 'Agree',
  'consensus.option.disagree': 'Disagree',
  'consensus.option.abstain': 'Abstain',
  'consensus.option.block': 'Block',
  'consensus.blocked': 'Blocked',
  'consensus.myVote': 'Your vote:',
  'consensus.reason': 'Reason',
  'consensus.blockWarning': 'Blocking stops the proposal. Explain your reason:',
  'consensus.blockPlaceholder': 'Block reason (required)...',
  'consensus.confirmBlock': 'Confirm Block',
  'consensus.cancel': 'Cancel',
  'consensus.agree': 'Agree',
  'consensus.disagree': 'Disagree',
  'consensus.abstain': 'Abstain',
  'consensus.block': 'Block',
  'consensus.blockReasons': 'Blocking reasons:',
  'lifecycle.draft': 'Draft',
  'lifecycle.discussion': 'Discussion',
  'lifecycle.voting': 'Voting',
  'lifecycle.result': 'Result',
  'lifecycle.executed': 'Executed',
  'delegation.title': 'Delegations',
  'delegation.votingFor': 'You vote on behalf of {count} member(s)',
  'delegation.toMe': 'They delegated their vote to you:',
  'delegation.you': 'You',
  'delegation.myDelegation': 'Your vote delegated to:',
  'delegation.revoke': 'Revoke',
  'delegation.placeholder': 'Delegate my vote to...',
  'delegation.delegate': 'Delegate',
  'delegation.empty': 'There are no active delegations.',
  'delegation.toast.created': 'Delegation created successfully',
  'delegation.toast.createError': 'Error creating delegation',
  'delegation.toast.revoked': 'Delegation revoked',
  'delegation.toast.revokeError': 'Error revoking delegation',
  'minutes.title': 'Voting Minutes',
  'minutes.approved': 'Approved',
  'minutes.approvedAt': 'Approved on',
  'minutes.signatures': 'Signatures ({count}):',
  'minutes.role.secretary': 'Secretary',
  'minutes.role.committee': 'Oversight Committee',
  'minutes.memberFallback': 'Member',
  'minutes.approving': 'Approving...',
  'minutes.approve': 'Approve Minutes',
  'minutes.signing': 'Signing...',
  'minutes.sign': 'Sign Minutes',
  'minutes.alreadySigned': 'You already signed',
  'minutes.description': 'Generate automatic minutes with the voting results.',
  'minutes.generating': 'Generating...',
  'minutes.generate': 'Generate Minutes',
  'votingViz.title': 'Voting Results',
  'votingViz.multipleTitle': 'Multiple Choice Voting Results',
  'votingViz.weight': '{count} weights',
  'votingViz.votes': '{count} votes',
  'votingViz.participation': 'Participation',
  'votingViz.quorum': 'Quorum',
  'votingViz.majority': 'Majority',
  'votingViz.reached': 'Reached',
  'votingViz.notReached': 'Not reached',
  'votingViz.notReachedF': 'Not reached',
  'votingViz.totalVotes': 'Total votes',
  'delivery.status.delivered': 'Delivered',
  'delivery.status.sent': 'Sent',
  'delivery.status.pending': 'Pending',
  'delivery.status.failed': 'Failed',
  'delivery.loading': 'Loading delivery status...',
  'delivery.empty': 'No notifications to track.',
  'delivery.title': 'Delivery Status',
  'delivery.rate': 'Delivery rate',
  'assemblyDetail.status.scheduled': 'Scheduled',
  'assemblyDetail.status.convened': 'Convened',
  'assemblyDetail.status.inSession': 'In session',
  'assemblyDetail.status.firstCall': '1st Call',
  'assemblyDetail.status.secondCall': '2nd Call',
  'assemblyDetail.status.thirdCall': '3rd Call',
  'assemblyDetail.status.completed': 'Completed',
  'assemblyDetail.status.cancelled': 'Cancelled',
  'assemblyDetail.type.ordinary': 'Ordinary',
  'assemblyDetail.type.extraordinary': 'Extraordinary',
  'assemblyDetail.statusUpdated': 'Status updated: {status}',
  'assemblyDetail.statusUpdateError': 'Error updating status',
  'assemblyDetail.action.startFirst': 'Start 1st Call',
  'assemblyDetail.action.cancel': 'Cancel',
  'assemblyDetail.action.toSecond': 'Move to 2nd Call',
  'assemblyDetail.action.startSession': 'Start Session',
  'assemblyDetail.action.toThird': 'Move to 3rd Call',
  'assemblyDetail.action.complete': 'Complete Assembly',
  'assemblyDetail.quorumMet': 'Quorum reached',
  'assemblyDetail.noLocation': 'No location',
  'assemblyDetail.calledBy': 'Called by',
  'assemblyDetail.callerDefault': 'Administrator',
  'context.ruleChange.title': 'Rule Change',
  'context.currentValue': 'Current value',
  'context.proposedValue': 'Proposed value',
  'context.key': 'Key',
  'context.current': 'Current',
  'context.proposed': 'Proposed',
  'context.noRuleDetail': 'No rule detail specified.',
  'context.viewRules': 'View Full Rules',
  'context.disbursement': 'Disbursement',
  'context.emergencyExpense': 'Emergency Expense',
  'context.majorWork': 'Major Work / Maintenance',
  'context.amount': 'Amount',
  'context.currentBalance': 'Current balance',
  'context.impact': 'Impact',
  'context.moreThanHalf': 'More than 50% of balance',
  'context.category': 'Category',
  'context.beneficiary': 'Beneficiary',
  'context.viewEntity': 'View entity',
  'context.viewTreasury': 'View Treasury',
  'context.quotaChange': 'Fee Change',
  'context.newFee': 'New fee',
  'context.activeMembers': 'Active members',
  'context.monthlyCollection': 'Monthly collection',
  'context.effectiveDate': 'Effective date',
  'context.quotaExecuteWarning': 'When executed, a payment obligation will be generated for each active member.',
  'context.viewCollection': 'View Collection',
  'context.budgetAllocation': 'Budget Allocation',
  'context.assignedAmount': 'Assigned amount',
  'context.period': 'Period',
  'context.viewBudgets': 'View Budgets',
  'context.memberAdmission': 'Member Admission',
  'context.memberAdmissionDescription': 'This proposal requires assembly approval to admit a new member to the community.',
  'context.memberAdmissionWarning': 'Once approved, the administrator must send the invitation manually from the Members section.',
  'context.viewMembers': 'View Members',
  'context.electionTitle': 'Board Election',
  'context.electionDescription': 'Electoral process to choose community administrative roles.',
  'context.currentRoles': 'Current roles',
  'context.periodN': 'Term #{n}',
  'context.electionLegal': 'Art. 42-46 LPCI CDMX — delinquent members cannot be elected to administrative roles.',
  'context.viewAdminTerms': 'View Administrative Terms',
  'invite.title': 'Invite Member',
  'invite.description': 'Send an email invitation to join the community.',
  'invite.sent': 'Invitation sent',
  'invite.sentDescription': 'An invitation email was sent to',
  'invite.emailSent': 'Invitation email sent',
  'invite.linkLabel': 'Invitation link',
  'invite.copyLink': 'Copy link',
  'invite.close': 'Close',
  'invite.emailLabel': 'Email',
  'invite.roleLabel': 'Role',
  'invite.emailRequired': 'Email is required',
  'invite.emailInvalid': 'Enter a valid email address',
  'invite.errorGeneric': 'Error sending invitation',
  'invite.cancel': 'Cancel',
  'invite.send': 'Send Invitation',
  'invite.sending': 'Sending...',
  'memberDir.searchPlaceholder': 'Search by name, email or role...',
  'memberDir.allRoles': 'All roles',
  'memberDir.allStatuses': 'All statuses',
  'memberDir.statusActive': 'Active',
  'memberDir.statusInactive': 'Inactive',
  'memberDir.statusPending': 'Pending',
  'memberDir.invite': 'Invite Member',
  'memberDir.loading': 'Loading members...',
  'memberDir.empty': 'No members registered',
  'memberDir.col.member': 'Member',
  'memberDir.col.email': 'Email',
  'memberDir.col.role': 'Role',
  'memberDir.col.status': 'Status',
  'memberDir.col.standing': 'Standing',
  'memberDir.col.since': 'Since',
  'memberDir.col.actions': 'Actions',
  'memberDir.noName': 'No name',
  'memberDir.active': 'Active',
  'memberDir.deactivate': 'Deactivate member',
  'memberDir.reactivate': 'Reactivate member',
  'memberDir.roleUpdated': 'Role updated',
  'memberDir.roleError': 'Error updating role',
  'memberDir.deactivated': 'Member deactivated',
  'memberDir.deactivateError': 'Error deactivating member',
  'memberDir.reactivated': 'Member reactivated',
  'memberDir.reactivateError': 'Error reactivating member',
  // Page titles & subtitles
  'announcements.title': 'Announcements',
  'announcements.subtitle': 'Community notices and communications',
  'calendar.title': 'Calendar',
  'calendar.subtitle': 'Assemblies, payments, and proposals in one place',
  'calendar.today': 'Today',
  'calendar.eventsFor': 'Events for',
  'calendar.noEvents': 'No events',
  'documents.title': 'Documents',
  'documents.subtitle': 'Community document management',
  'documents.upload': 'Upload Document',
  'documents.communityDocs': 'Community documents',
  'documents.searchPlaceholder': 'Search documents...',
  'documents.loading': 'Loading documents...',
  'documents.noResults': 'No results for your search',
  'documents.empty': 'No documents yet',
  'documents.noResultsHint': 'Try a different term',
  'documents.emptyHint': 'Upload the first one with the button above',
  'profile.title': 'My Profile',
  'profile.subtitle': 'Manage your account and preferences',
  'profile.personalInfo': 'Personal Information',
  'profile.fullName': 'Full name',
  'profile.email': 'Email',
  'profile.emailHint': 'Email address cannot be changed',
  'profile.saveChanges': 'Save changes',
  'profile.saving': 'Saving...',
  'profile.nameUpdated': 'Name updated successfully',
  'profile.changePassword': 'Change Password',
  'profile.newPassword': 'New password',
  'profile.confirmPassword': 'Confirm new password',
  'profile.updatePassword': 'Update password',
  'profile.updating': 'Updating...',
  'profile.passwordUpdated': 'Password updated successfully',
  'profile.myCommunities': 'My Communities',
  'profile.noCommunities': 'You are not a member of any community yet.',
  'profile.switchTo': 'Switch to this',
  'profile.current': 'Current',
  'profile.activitySummary': 'Activity Summary',
  'profile.roleInCommunity': 'Role in current community',
  'profile.financialStatus': 'Financial status',
  'profile.votingWeight': 'Voting weight',
  'profile.memberSince': 'Member since',
  'profile.dataPrivacy': 'Data & Privacy',
  'settings.subtitle': 'Name, rules, categories and invitations',
  'settings.tab.notifications': 'Notifications',
  'settings.tab.audit': 'Audit',
  'settings.categories.title': 'Category Management',
  'settings.invitations.title': 'Pending Invitations',
  'settings.invitations.create': 'Create invitation',
  'settings.invitations.empty': 'No pending invitations.',
  'settings.backToPanel': 'Back to dashboard',
  'governance.subtitle.delegations': 'Manage vote delegations between members',
  'governance.subtitle.minutes': 'Minutes generated from executed proposals',
  'governance.subtitle.rules': 'Current community rulebook',
  'governance.loadingMember': 'Loading member information...',
  'community.directory.members': 'Members',
  'community.directory.providers': 'Providers',
  'residential.title': 'Residential',
  'residential.subtitle': 'Units, maintenance, common areas, and reservations',
  'memberDetail.title': 'Member Detail',
  'memberDetail.back': 'Back to Community',
  'memberDetail.loading': 'Loading member profile...',
  'memberDetail.notFound': 'Member not found',
  'entityDetail.title': 'Entity Detail',
  'common.notFound': 'Not found',
  // Announcements, auth, contracts, deliberation, entities, recurring, treasury
  'announcements.confirmDelete': 'Delete this announcement?',
  'announcements.deleted': 'Announcement deleted',
  'announcements.edit': 'Edit Announcement',
  'announcements.empty': 'No announcements published.',
  'announcements.errorDeleting': 'Error deleting',
  'announcements.errorSaving': 'Error saving announcement',
  'announcements.expires': 'Expires',
  'announcements.expiresOptional': 'Expires (optional)',
  'announcements.message': 'Message',
  'announcements.new': 'New Announcement',
  'announcements.pin': 'Pin',
  'announcements.pinToTop': 'Pin to top',
  'announcements.priority': 'Priority',
  'announcements.priority.low': 'Low',
  'announcements.priority.normal': 'Normal',
  'announcements.priority.urgent': 'Urgent',
  'announcements.publish': 'Publish',
  'announcements.publishFirst': 'Publish the first one',
  'announcements.published': 'Announcement published',
  'announcements.publishedCount': 'announcements published',
  'announcements.unpin': 'Unpin',
  'announcements.updated': 'Announcement updated',
  'auth.forgotPassword.backToLogin': 'Back to login',
  'auth.forgotPassword.checkEmail': 'Check your email',
  'auth.forgotPassword.checkInbox': 'Check your inbox and spam folder.',
  'auth.forgotPassword.ifAccountExists': 'If an account exists for ',
  'auth.forgotPassword.linkExpiry': 'The link will expire in 1 hour for security.',
  'auth.forgotPassword.sendAgain': 'Send again',
  'auth.forgotPassword.sendResetLink': 'Send reset link',
  'auth.forgotPassword.subtitle': 'Enter your email and we will send you a link to reset your password.',
  'auth.forgotPassword.title': 'Recover Password',
  'auth.forgotPassword.willReceiveLink': ', you will receive a link to reset your password.',
  'auth.invite.acceptError': 'Error accepting invitation',
  'auth.invite.acceptInvitation': 'Accept invitation',
  'auth.invite.acceptedRedirecting': 'Invitation accepted. Redirecting to dashboard...',
  'auth.invite.accepting': 'Accepting...',
  'auth.invite.asRole': 'as',
  'auth.invite.createAccount': 'Create account',
  'auth.invite.createOrLogin': 'Create an account or sign in to accept.',
  'auth.invite.goHome': 'Go home',
  'auth.invite.invalidDesc': 'This invitation has expired, was already used, or does not exist.',
  'auth.invite.invalidTitle': 'Invalid invitation',
  'auth.invite.invitedAsRole': 'You have been invited as',
  'auth.invite.invitedEmail': 'Invited to:',
  'auth.invite.invitedTo': 'You have been invited to',
  'auth.invite.invitedWithRole': 'You have been invited with the role of',
  'auth.invite.pendingTitle': 'Pending invitation',
  'auth.invite.signIn': 'Sign in',
  'auth.invite.verifyError': 'Could not verify invitation',
  'auth.invite.verifying': 'Verifying invitation...',
  'auth.invite.welcome': 'Welcome',
  'auth.invite.withRole': 'with the role of',
  'auth.invite.youAreInvited': 'You have been invited',
  'auth.login.error': 'Invalid credentials',
  'auth.login.forgotPassword': 'Forgot your password?',
  'auth.login.inviteMessage': 'You have a pending invitation. Sign in to accept it.',
  'auth.login.noAccount': 'Don\'t have an account?',
  'auth.login.signUp': 'Sign up',
  'auth.login.signingIn': 'Signing in...',
  'auth.login.subtitle': 'Sign in to your account',
  'auth.login.title': 'Sign In',
  'auth.register.checkEmail': 'Check your email!',
  'auth.register.confirmToAccess': 'Confirm your email to access your account.',
  'auth.register.confirmationSent': 'We sent a confirmation email to',
  'auth.register.error': 'Registration error',
  'auth.register.fullName': 'Full name',
  'auth.register.goToLogin': 'Go to login',
  'auth.register.hasAccount': 'Already have an account?',
  'auth.register.minChars': 'Minimum 6 characters',
  'auth.register.registering': 'Registering...',
  'auth.register.signIn': 'Sign in',
  'auth.register.subtitle': 'Create your account to get started',
  'auth.register.title': 'Create Account',
  'auth.resetPassword.backToLogin': 'Back to login',
  'auth.resetPassword.confirmPassword': 'Confirm password',
  'auth.resetPassword.enterNewPassword': 'Enter your new password',
  'auth.resetPassword.invalidLink': 'Invalid link',
  'auth.resetPassword.invalidLinkDesc': 'This recovery link is invalid or has expired.',
  'auth.resetPassword.linksExpire': 'Recovery links expire after 1 hour.',
  'auth.resetPassword.newPassword': 'New password',
  'auth.resetPassword.passwordsMatch': 'Passwords match',
  'auth.resetPassword.passwordsNoMatch': 'Passwords do not match',
  'auth.resetPassword.repeatPassword': 'Repeat password',
  'auth.resetPassword.req.lowercase': 'One lowercase',
  'auth.resetPassword.req.minChars': 'Minimum 8 characters',
  'auth.resetPassword.req.number': 'One number',
  'auth.resetPassword.req.uppercase': 'One uppercase',
  'auth.resetPassword.requestNewLink': 'Request new link',
  'auth.resetPassword.requirementsNotMet': 'Password does not meet requirements',
  'auth.resetPassword.strength.fair': 'Fair',
  'auth.resetPassword.strength.good': 'Good',
  'auth.resetPassword.strength.strong': 'Strong',
  'auth.resetPassword.strength.weak': 'Weak',
  'auth.resetPassword.strengthLabel': 'Strength:',
  'auth.resetPassword.subtitle': 'Set your new password',
  'auth.resetPassword.successDesc': 'Your password has been updated successfully.',
  'auth.resetPassword.successTitle': 'Password updated!',
  'auth.resetPassword.title': 'Reset Password',
  'auth.resetPassword.updateError': 'Error updating password',
  'auth.resetPassword.updatePassword': 'Update password',
  'auth.resetPassword.updating': 'Updating...',
  'auth.resetPassword.validatingRequest': 'Validating request...',
  'auth.resetPassword.verifyingLink': 'Verifying recovery link...',
  'contracts.action': 'Action',
  'contracts.activeContracts': 'Active contracts',
  'contracts.allStatuses': 'All statuses',
  'contracts.approvedByProposal': 'Approved by proposal',
  'contracts.backToContracts': 'Back to contracts',
  'contracts.by': 'by',
  'contracts.compliance': 'Compliance',
  'contracts.confirmDelete': 'Delete this contract? This action cannot be undone.',
  'contracts.confirmRegisterPayment': 'Register this payment?',
  'contracts.contract': 'Contract',
  'contracts.contractParties': 'Contract parties',
  'contracts.create': 'Create Contract',
  'contracts.created': 'Contract created',
  'contracts.createdBy': 'Created by',
  'contracts.creating': 'Creating...',
  'contracts.defaulted': 'Defaulted',
  'contracts.deleteContract': 'Delete contract',
  'contracts.deleted': 'Contract deleted',
  'contracts.description': 'Description',
  'contracts.descriptionLabel': 'Description',
  'contracts.dueDate': 'Due date',
  'contracts.empty': 'No contracts registered',
  'contracts.endDate': 'End date',
  'contracts.entity': 'Entity',
  'contracts.entityProvider': 'Entity / Provider',
  'contracts.errorCreating': 'Error creating contract',
  'contracts.errorDeleting': 'Error deleting contract',
  'contracts.errorRegisteringPayment': 'Error registering payment',
  'contracts.errorUpdatingStatus': 'Error updating status',
  'contracts.freq.annual': 'Annual',
  'contracts.freq.bimonthly': 'Bimonthly',
  'contracts.freq.biweekly': 'Biweekly',
  'contracts.freq.monthly': 'Monthly',
  'contracts.freq.oneTime': 'One-time',
  'contracts.freq.quarterly': 'Quarterly',
  'contracts.freq.semiannual': 'Semiannual',
  'contracts.freq.weekly': 'Weekly',
  'contracts.indefinite': 'Indefinite',
  'contracts.installmentAutoGenNote': 'Installments will be auto-generated based on frequency.',
  'contracts.installments': 'Installments',
  'contracts.loadingInstallments': 'Loading installments...',
  'contracts.member': 'Member',
  'contracts.nameAndAmountRequired': 'Name and amount are required',
  'contracts.namePlaceholder': 'Contract name',
  'contracts.new': 'New Contract',
  'contracts.noEntity': 'No entity',
  'contracts.noLinkedParties': 'No linked parties',
  'contracts.numInstallments': 'Num. installments',
  'contracts.paidDate': 'Paid',
  'contracts.pay': 'Pay',
  'contracts.paymentFrequency': 'Payment frequency',
  'contracts.paymentPlan': 'Payment plan',
  'contracts.paymentRegistered': 'Payment registered',
  'contracts.registerPayment': 'Register payment',
  'contracts.startDate': 'Start date',
  'contracts.statusUpdated': 'Status updated',
  'contracts.totalAmount': 'Total amount',
  'deliberation.comment': 'Comment',
  'deliberation.commentPlaceholder': 'Write your comment...',
  'deliberation.confirmDeleteComment': 'Delete this comment?',
  'deliberation.ctrlEnterToSend': 'Ctrl+Enter to send',
  'deliberation.edited': '(edited)',
  'deliberation.member': 'Member',
  'deliberation.reply': 'Reply',
  'deliberation.stance': 'Stance',
  'deliberation.writeReplyPlaceholder': 'Write your reply...',
  'entities.actions': 'Actions',
  'entities.address': 'Address',
  'entities.addressPlaceholder': 'Fiscal address',
  'entities.allStatuses': 'All statuses',
  'entities.allTypes': 'All types',
  'entities.confirmDelete': 'Delete this entity?',
  'entities.contact': 'Contact',
  'entities.contactPerson': 'Contact Person',
  'entities.contactPersonPlaceholder': 'Primary contact name',
  'entities.create': 'Create Entity',
  'entities.creating': 'Creating...',
  'entities.deleted': 'Entity deleted',
  'entities.empty': 'No entities registered. Add providers, partners and contractors.',
  'entities.errorCreating': 'Error creating entity',
  'entities.errorDeleting': 'Error deleting entity',
  'entities.namePlaceholder': 'Entity name',
  'entities.nameRequired': 'Name is required',
  'entities.new': 'New Entity',
  'entities.notes': 'Notes',
  'entities.notesPlaceholder': 'Internal notes',
  'entities.optional': 'Optional',
  'entities.phone': 'Phone',
  'entities.rating': 'Rating',
  'entities.rfc': 'Tax ID',
  'entities.searchPlaceholder': 'Search by name, tax ID, contact...',
  'entities.status': 'Status',
  'entities.type': 'Type',
  'entities.unrated': 'Unrated',
  'recurring.activate': 'Activate',
  'recurring.active': 'Active',
  'recurring.activeStatus': 'Active',
  'recurring.allActiveMembers': 'All active members',
  'recurring.allMembers': 'All members',
  'recurring.collection': 'Collection',
  'recurring.collectionToMembers': 'Collection (to members)',
  'recurring.collections': 'Collections',
  'recurring.confirmDelete': 'Delete this recurring payment? Existing obligations will not be deleted.',
  'recurring.creating': 'Creating...',
  'recurring.dayOfMonth': 'Day of month',
  'recurring.deleteRecurring': 'Delete recurring',
  'recurring.deleted': 'Recurring deleted',
  'recurring.description': 'Recurring charges or payments (e.g. monthly fee, periodic contribution).',
  'recurring.descriptionLabel': 'Description',
  'recurring.empty': 'No recurring payments. Create one to automate fees and provider payments.',
  'recurring.end': 'End',
  'recurring.endDateOptional': 'End date (optional)',
  'recurring.entityProviderPartner': 'Entity (provider/partner)',
  'recurring.errorCreating': 'Error creating',
  'recurring.errorDeleting': 'Error deleting recurring',
  'recurring.errorProcessing': 'Error processing pending',
  'recurring.errorRunning': 'Error running recurring',
  'recurring.errorUpdating': 'Error updating recurring',
  'recurring.frequency': 'Frequency',
  'recurring.lastRun': 'Last run',
  'recurring.members': 'Members',
  'recurring.more': 'more',
  'recurring.nameAndAmountRequired': 'Name and amount are required',
  'recurring.namePlaceholder': 'Payment name',
  'recurring.new': 'New Recurring',
  'recurring.newRecurring': 'New Recurring Payment',
  'recurring.nextRun': 'Next run',
  'recurring.obligationsGenerated': 'Obligations generated',
  'recurring.pause': 'Pause',
  'recurring.paused': 'Paused',
  'recurring.payment': 'Payment',
  'recurring.paymentToEntity': 'Payment (to entity)',
  'recurring.payments': 'Payments',
  'recurring.pendingProcessed': 'Pending processed',
  'recurring.processPending': 'Process Pending',
  'recurring.runNow': 'Run now',
  'recurring.runs': 'runs',
  'recurring.select': 'Select...',
  'recurring.specificMembers': 'Specific members',
  'recurring.target': 'Target',
  'recurring.updated': 'Recurring updated',
  'treasury.actual': 'Actual',
  'treasury.allFieldsRequired': 'All fields are required',
  'treasury.amount': 'Amount',
  'treasury.budget': 'Budget',
  'treasury.budgetDeleted': 'Budget deleted',
  'treasury.category': 'Category',
  'treasury.categoryCreated': 'Category created successfully',
  'treasury.categoryDeleted': 'Category deleted',
  'treasury.categoryNamePlaceholder': 'Category name',
  'treasury.categoryUpdated': 'Category updated',
  'treasury.confirmDeleteBudget': 'Are you sure you want to delete this budget? This action cannot be undone.',
  'treasury.confirmDeleteCategory': 'Delete this category? Existing transactions will retain their history.',
  'treasury.create': 'Create',
  'treasury.creating': 'Creating...',
  'treasury.deleteBudget': 'Delete budget',
  'treasury.deleteCategory': 'Delete category',
  'treasury.difference': 'Difference',
  'treasury.errorCreatingBudget': 'Error creating budget',
  'treasury.errorCreatingCategory': 'Error creating category',
  'treasury.errorDeletingBudget': 'Error deleting budget',
  'treasury.errorDeletingCategory': 'Error deleting category',
  'treasury.errorUpdatingBudget': 'Error updating budget',
  'treasury.errorUpdatingCategory': 'Error updating category',
  'treasury.expense': 'Expense',
  'treasury.income': 'Income',
  'treasury.loadingBudgets': 'Loading budgets...',
  'treasury.loadingCategories': 'Loading categories...',
  'treasury.newBudget': 'New Budget',
  'treasury.noBudgets': 'No budgets defined.',
  'treasury.noCategories': 'No categories configured',
  'treasury.period': 'Period',
  'treasury.selectCategory': 'Select category...',
  'treasury.system': 'System',
}

export const MESSAGES: Record<string, Dictionary> = {
  es,
  en,
}
