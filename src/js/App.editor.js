let editor = {
    isOpen: false,
    // functions
    init: function (opt) {
        if (this.isOpen) return false;

        this.name = opt.name || 'editor';
        this.content = opt.content;

        this.closeText = opt.closeText || 'Отмена';
        this.submitText = opt.submitText || 'Отправить';

        this.onSubmit = opt.onSubmit;

        this.$instance = $(App.templates.editor({
            name: this.name,
            content: this.content,
            closeText: this.closeText,
            submitText: this.submitText
        })).appendTo('body');

        var self = this;

        this.$instance.modal({
            preventScrolling: false,
            onCloseEnd: function () {
                self.reset();
            }
        });

        this.$instance.find('form').on('submit', function (e) {
            e.preventDefault();
            var data = new FormData(this);

            if (self.onSubmit(data)) {
                self.$instance.modal('close');
            }
        });

        this.$instance.modal('open');
        this.isOpen = true;
    },
    reset: function () {
        if (!this.isOpen) return false;

        this.$instance.modal('destroy').remove();

        delete this.name;
        delete this.content;
        delete this.closeText;
        delete this.submitText;
        delete this.onSubmit;
        delete this.$instance;
        this.isOpen = false;
    }
};

export {editor};