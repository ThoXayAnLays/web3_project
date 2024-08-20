exports.up = (pgm) => {
    pgm.createTable('transactions', {
        id: 'id',
        user_address: { type: 'varchar(42)', notNull: true },
        event_type: { type: 'varchar(50)', notNull: true },
        amount: { type: 'numeric', notNull: true },
        timestamp: { type: 'timestamp', notNull: true },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    pgm.createIndex('transactions', 'user_address');
    pgm.createIndex('transactions', 'timestamp');
};

exports.down = (pgm) => {
    pgm.dropTable('transactions');
};