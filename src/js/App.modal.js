let modal = {
    isOpen: false,
    // functions
    init: function (opt) {
        if (this.isOpen) return false;

        this.name = opt.name || 'modal';
        this.title = opt.title || false;
        this.content = opt.content;

        this.fixedFooter = opt.fixedFooter || false;

        this.canClose = opt.canClose === false ? false : true;
        this.closeText = opt.closeText || 'Закрыть';
        this.isForm = opt.isForm === false ? false : true;
        this.submitText = opt.submitText || 'Отправить';

        this.onOpen = opt.onOpen;
        this.onClose = opt.onClose;
        this.onSubmit = opt.onSubmit;

        this.$instance = $(App.templates.modal({
            name: this.name,
            title: this.title,
            content: this.content,
            fixedFooter: this.fixedFooter,
            canClose: this.canClose,
            closeText: this.closeText,
            isForm: this.isForm,
            submitText: this.submitText
        })).appendTo('body');

        var self = this;

        this.$instance.modal({
            dismissible: self.canClose,
            preventScrolling: false,
            onOpenEnd: function () {
                if (self.onOpen) self.onOpen(self.$instance);
            },
            onCloseEnd: function () {
                self.reset();
            }
        });

        if (this.isForm) {
            this.$instance.find('form').on('submit', function (e) {
                e.preventDefault();
                var data = new FormData(this);

                if (self.onSubmit(data)) {
                    self.$instance.modal('close');
                }
            });
        }

        this.$instance.modal('open');
        this.isOpen = true;
    },
    updateContent: function (content) {
        if (!this.isOpen) return false;
        this.content = content;
        this.$instance.find('.content').html(this.content);
    },
    reset: function () {
        if (!this.isOpen) return false;

        if (this.onClose) this.onClose(this.$instance);

        this.$instance.modal('destroy').remove();

        delete this.name;
        delete this.title;
        delete this.content;
        delete this.isForm;
        delete this.canClose;
        delete this.closeText;
        delete this.submitText;
        delete this.onOpen;
        delete this.onClose;
        delete this.onSubmit;
        delete this.$instance;
        this.isOpen = false;

    }
};

export {modal};